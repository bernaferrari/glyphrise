/** Render real starter scenes once; welcome cards only decode small videos.
 * Run: node scripts/generate-starter-previews.mjs (requires ffmpeg).
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
        '<style>html,body,#root{margin:0;width:256px;height:256px}#root>div{width:100%;height:100%}canvas{display:block}span{display:none}</style><div id="root"></div><script type="module" src="/renderer.js"></script>'
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
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } })
  page.on("pageerror", (error) => process.stderr.write(`${error.message}\n`))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => window.starterPreview?.ready)
  const ids = await page.evaluate(() => window.starterPreview.ids)
  await mkdir(output, { recursive: true })
  for (const id of ids) {
    const frames = join(temporary, id)
    await mkdir(frames)
    // Sample the authored three-second motion over six seconds at full fps.
    for (let index = 0; index < 144; index++) {
      const png = await page.evaluate(
        ({ id, time }) => window.starterPreview.render(id, time),
        { id, time: index / 48 }
      )
      await writeFile(
        join(frames, `${String(index).padStart(3, "0")}.png`),
        Buffer.from(png, "base64")
      )
    }
    encode([
      "-framerate",
      "24",
      "-i",
      join(frames, "%03d.png"),
      "-an",
      "-c:v",
      "libx264",
      "-crf",
      "23",
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
      `${id}: ${(video.length / 1024).toFixed(1)} KB, 256px, 6s at 24fps`
    )
  }
} finally {
  await browser?.close()
  server?.close()
  await rm(temporary, { recursive: true, force: true })
}
