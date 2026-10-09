/** Render real starter scenes once; welcome cards only decode small videos.
 * Run: node scripts/generate-starter-previews.mjs [starter-id…] (requires ffmpeg).
 * With ids, only those starters are re-rendered.
 */
import { createRequire } from "node:module"
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { resolve, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawnSync } from "node:child_process"
import { chromium } from "@playwright/test"

const root = fileURLToPath(new URL("../", import.meta.url))
const require = createRequire(import.meta.url)
const viteRequire = createRequire(require.resolve("vitest/package.json"))
const { build } = await import(pathToFileURL(viteRequire.resolve("vite")).href)
const temporary = await mkdtemp(join(tmpdir(), "glyphrise-starters-"))
const output = resolve(root, "public/starter-previews")
const only = new Set(process.argv.slice(2))
// The poster (and the loop's first frame) should explain the starter at a
// glance: Wi-Fi starts switched off, coming back around to face front.
const START_TIMES = { wifi: 3.2 }
let browser
let server
const encode = (args) => {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { encoding: "utf8" }
  )
  if (result.status !== 0)
    throw new Error(result.stderr || "ffmpeg is required")
}
try {
  await build({
    configFile: false,
    root,
    logLevel: "warn",
    resolve: { alias: { "@": root } },
    define: { "process.env.NODE_ENV": '"production"' },
    oxc: { jsx: { runtime: "automatic" } },
    build: {
      outDir: join(temporary, "bundle"),
      emptyOutDir: true,
      lib: {
        entry: resolve(root, "scripts/starter-preview-renderer.tsx"),
        formats: ["es"],
        fileName: "renderer",
      },
    },
  })
  server = createServer(async (request, response) => {
    const name = new URL(request.url, "http://localhost").pathname
    if (name === "/") {
      response.setHeader("Content-Type", "text/html")
      response.end(
        '<style>html,body,#root{margin:0;width:512px;height:512px}#root>div{width:100%;height:100%}canvas{display:block}span{display:none}</style><div id="root"></div><script type="module" src="/renderer.js"></script>'
      )
      return
    }
    try {
      response.setHeader("Content-Type", "application/javascript")
      response.end(await readFile(join(temporary, "bundle", name.slice(1))))
    } catch {
      response.statusCode = 404
      response.end()
    }
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  // Same browser as the e2e suite (playwright.config.ts).
  browser = await chromium.launch({ channel: "chrome" })
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } })
  page.on("pageerror", (error) => process.stderr.write(`${error.message}\n`))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => window.starterPreview?.ready)
  const starters = await page.evaluate(() => window.starterPreview.starters)
  await mkdir(output, { recursive: true })
  for (const [starterIndex, { id, duration }] of starters.entries()) {
    if (only.size && !only.has(id)) continue
    const frames = join(temporary, id)
    await mkdir(frames)
    // Continuous motion with no held endpoint or duplicated loop frame.
    // Offset the loops so the four motions don't all peak together.
    const phase = START_TIMES[id] ?? starterIndex * 0.7
    for (let index = 0; index < Math.round(duration * 30); index++) {
      const png = await page.evaluate(
        ({ id, time }) => window.starterPreview.render(id, time),
        { id, time: (index / 30 + phase) % duration }
      )
      await writeFile(
        join(frames, `${String(index).padStart(3, "0")}.png`),
        Buffer.from(png, "base64")
      )
    }
    encode([
      "-framerate",
      "30",
      "-i",
      join(frames, "%03d.png"),
      "-an",
      "-c:v",
      "libx264",
      "-crf",
      "20",
      "-preset",
      "slow",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      join(output, `${id}.mp4`),
    ])
    await writeFile(
      join(output, `${id}.png`),
      await readFile(join(frames, "000.png"))
    )
    const video = await readFile(join(output, `${id}.mp4`))
    console.log(
      `${id}: ${(video.length / 1024).toFixed(1)} KB, 512px, ${duration}s at 30fps`
    )
  }
} finally {
  await browser?.close()
  server?.close()
  await rm(temporary, { recursive: true, force: true })
}
