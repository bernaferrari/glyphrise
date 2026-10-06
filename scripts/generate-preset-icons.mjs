/** Bundle Google's Material Symbols for presets; no network is needed at runtime.
 * Source: https://github.com/google/material-design-icons (Apache-2.0).
 */
import { createRequire } from "node:module"
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const require = createRequire(import.meta.url)
const viteRequire = createRequire(require.resolve("vitest/package.json"))
const { build } = await import(pathToFileURL(viteRequire.resolve("vite")).href)
const temporary = await mkdtemp(join(tmpdir(), "glyphrise-symbols-"))
const sources = JSON.parse(
  await readFile(new URL("./preset-icons.json", import.meta.url), "utf8")
)

try {
  const entry = join(temporary, "normalize.ts")
  await writeFile(
    entry,
    `export { normalizeSvgToIconViewBox } from ${JSON.stringify(join(root, "components/3d/SvgText.ts"))};
export { validateAndSanitizeSvg } from ${JSON.stringify(join(root, "components/editor/SvgImportModel.ts"))};`
  )
  await build({
    configFile: false,
    root,
    logLevel: "warn",
    resolve: { alias: { "@": root } },
    build: {
      outDir: join(temporary, "bundle"),
      lib: { entry, formats: ["es"], fileName: () => "normalize.mjs" },
    },
  })
  const { normalizeSvgToIconViewBox, validateAndSanitizeSvg } = await import(
    pathToFileURL(join(temporary, "bundle/normalize.mjs")).href
  )
  const icons = await Promise.all(
    sources.map(async ({ symbol, ...metadata }) => {
      const response = await fetch(
        `https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/${symbol}/materialsymbolsoutlined/${symbol}_24px.svg`
      )
      if (!response.ok)
        throw new Error(`Could not download ${symbol}: ${response.status}`)
      return {
        ...metadata,
        id: `material-symbol-outlined-${symbol}`,
        tags: [...new Set([symbol, "outlined", ...metadata.tags])],
        svgContent: validateAndSanitizeSvg(
          normalizeSvgToIconViewBox((await response.text()).trim())
        ),
      }
    })
  )
  await writeFile(
    join(root, "components/editor/PresetIcons.generated.json"),
    JSON.stringify(icons, null, 2) + "\n"
  )
  process.stdout.write(`Bundled ${icons.length} Material Symbols.\n`)
} finally {
  await rm(temporary, { recursive: true, force: true })
}
