#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Pairs come from the Flutter demo catalog. Only the on icon is kept: this
// editor draws a slash for the off state instead of importing the off glyph.
// Names are resolved through MaterialSymbolName → Symbols.*, then spelled the
// way Google's ligature catalog spells them (Dart cannot name 1x_mobiledata).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const outputPath = path.join(
  projectRoot,
  "components/editor/MaterialWipePairs.generated.json"
)
const namesPath = path.join(
  projectRoot,
  "components/editor/MaterialSymbolNames.generated.json"
)
const flutterLib = path.resolve(
  projectRoot,
  "../../kotlin/diagonal-wipe-icon-flutter/example/lib"
)
const catalogPath =
  process.argv[2] ?? path.join(flutterLib, "demo_catalog.dart")
const assetsPath =
  process.argv[3] ??
  path.join(flutterLib, "app/support/material_symbol_assets.dart")

const LEADING_NUMBER_WORDS = [
  ["zero_", "0"],
  ["one_", "1"],
  ["two_", "2"],
  ["three_", "3"],
  ["four_", "4"],
  ["five_", "5"],
  ["six_", "6"],
  ["seven_", "7"],
  ["eight_", "8"],
  ["nine_", "9"],
]

const googleLigature = (dartKey, names) => {
  if (names.has(dartKey)) return dartKey
  for (const [prefix, digit] of LEADING_NUMBER_WORDS) {
    if (!dartKey.startsWith(prefix)) continue
    const candidate = `${digit}${dartKey.slice(prefix.length)}`
    if (names.has(candidate)) return candidate
  }
  throw new Error(
    `Material Symbol "${dartKey}" is not in the Google ligature catalog.`
  )
}

const sliceList = (source, declaration) => {
  const start = source.indexOf(declaration)
  if (start === -1) throw new Error(`Missing Dart list: ${declaration}`)

  let depth = 0
  let started = false
  for (
    let index = start + declaration.length - 1;
    index < source.length;
    index += 1
  ) {
    const char = source[index]
    if (char === "[") {
      depth += 1
      started = true
    } else if (char === "]") {
      depth -= 1
      if (started && depth === 0)
        return source.slice(start + declaration.length, index)
    }
  }

  throw new Error(`Unterminated Dart list: ${declaration}`)
}

const parsePairs = (listBody) => {
  const pairs = []
  let buffer = ""
  let depth = 0

  for (const line of listBody.split("\n")) {
    const trimmed = line.trim()
    if (depth === 0 && (trimmed === "" || trimmed.startsWith("//"))) continue
    if (depth === 0 && !trimmed.includes("MaterialWipeIconPair")) continue

    buffer += `${line}\n`
    for (const char of line) {
      if (char === "(") depth += 1
      else if (char === ")") depth -= 1
    }

    if (depth !== 0 || !buffer.includes("MaterialWipeIconPair")) continue

    const fields = Object.fromEntries(
      [...buffer.matchAll(/(\w+):\s*"([^"]*)"/g)].map((match) => [
        match[1],
        match[2],
      ])
    )
    if (!fields.label || !fields.enabledIconName || !fields.disabledIconName) {
      throw new Error(`Incomplete wipe pair:\n${buffer}`)
    }
    pairs.push(fields)
    buffer = ""
  }

  if (depth !== 0) throw new Error("Unbalanced MaterialWipeIconPair call")
  return pairs
}

const parseLookup = (source) => {
  const lookups = new Map()
  const pattern =
    /MaterialSymbolName\.([A-Za-z0-9_]+)\s*=>[\s\S]*?Symbols\.([A-Za-z0-9_]+)/g
  for (const match of source.matchAll(pattern)) {
    lookups.set(match[1], match[2])
  }
  if (lookups.size < 100) throw new Error("Symbol lookup did not parse")
  return lookups
}

const catalogNameToField = (catalogName) =>
  `${catalogName[0].toLowerCase()}${catalogName.slice(1)}`

const resolveIcon = (catalogName, lookup, names) => {
  const field = catalogNameToField(catalogName)
  const dartKey = lookup.get(field)
  if (!dartKey) throw new Error(`No symbol lookup for ${catalogName}`)
  return googleLigature(dartKey, names)
}

const toPairs = (entries, lookup, names) => {
  const seen = new Set()
  return entries.map((entry) => {
    if (seen.has(entry.label)) {
      throw new Error(`Duplicate wipe pair label: ${entry.label}`)
    }
    seen.add(entry.label)
    return {
      label: entry.label,
      enabled: resolveIcon(entry.enabledIconName, lookup, names),
    }
  })
}

const [catalogSource, assetsSource, symbolNames] = await Promise.all([
  fs.readFile(catalogPath, "utf8"),
  fs.readFile(assetsPath, "utf8"),
  fs.readFile(namesPath, "utf8").then((text) => new Set(JSON.parse(text))),
])
const lookup = parseLookup(assetsSource)
const readyDeclaration =
  "final List<MaterialWipeIconPair> coreMaterialWipeIconCatalog = ["
const refinementDeclaration =
  "final List<MaterialWipeIconPair> knownProblemsMaterialWipeIconCatalog = ["
const catalog = {
  ready: toPairs(
    parsePairs(sliceList(catalogSource, readyDeclaration)),
    lookup,
    symbolNames
  ),
  refinement: toPairs(
    parsePairs(sliceList(catalogSource, refinementDeclaration)),
    lookup,
    symbolNames
  ),
}

await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`)
console.log(
  `Wrote ${catalog.ready.length} ready pairs and ${catalog.refinement.length} refinement pairs to ${path.relative(
    projectRoot,
    outputPath
  )}.`
)
