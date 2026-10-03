#!/usr/bin/env node

import fs from "node:fs/promises"

// Google's complete font ligature index. Bundle it so browsing and searching
// don't depend on a catalog request succeeding at runtime.
const CATALOG_URL =
  "https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints"
const sourcePath = process.argv[2]
let source
if (sourcePath) {
  source = await fs.readFile(sourcePath, "utf8")
} else {
  const response = await fetch(CATALOG_URL)
  if (!response.ok) {
    throw new Error(`Failed to download Material Symbols: ${response.status}`)
  }
  source = await response.text()
}

const namesByCodepoint = new Map()
const names = Array.from(
  new Set(
    source
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const match = line.trim().match(/^([a-z0-9_]+)\s+[a-f0-9]+$/i)
        if (!match) throw new Error(`Invalid symbol index entry: ${line}`)
        const codepoint = line.trim().split(/\s+/)[1]
        const group = namesByCodepoint.get(codepoint) ?? []
        group.push(match[1])
        namesByCodepoint.set(codepoint, group)
        return match[1]
      })
  )
).sort()
if (names.length < 3000)
  throw new Error("Material Symbols catalog is incomplete")

await fs.writeFile(
  new URL(
    "../components/editor/MaterialSymbolNames.generated.json",
    import.meta.url
  ),
  `${JSON.stringify(names, null, 2)}\n`
)
const aliases = {}
for (const group of namesByCodepoint.values()) {
  if (group.length < 2) continue
  for (const name of group) {
    aliases[name] = group
      .filter((alias) => alias !== name)
      .sort((a, b) => a.length - b.length)
  }
}
await fs.writeFile(
  new URL(
    "../components/editor/MaterialSymbolAliases.generated.json",
    import.meta.url
  ),
  `${JSON.stringify(aliases, null, 2)}\n`
)
console.log(`Bundled ${names.length} Material Symbol names.`)
