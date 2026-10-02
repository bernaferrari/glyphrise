import { normalizeMaterialSymbolName } from "../IconLibrary"
import {
  MATERIAL_WIPE_READY_PAIRS,
  type MaterialWipeIconPair,
} from "../MaterialWipePairs"

const FALLBACK_MATERIAL_SYMBOL_NAMES = [
  "home",
  "search",
  "settings",
  "person",
  "favorite",
  "star",
  "arrow_forward",
  "event_list",
  "palette",
  "bolt",
]

export const materialSymbolQuery = (query: string) =>
  normalizeMaterialSymbolName(query)

// Search the vocabulary people use, while keeping exact symbol names first.
const SYMBOL_ALIASES: Record<string, string[]> = {
  favorite: ["heart", "love", "like"],
  person: ["user", "profile", "avatar", "account"],
  account_circle: ["user", "profile", "avatar"],
  delete: ["trash", "bin", "remove", "garbage"],
  settings: ["gear", "preferences", "cog"],
  search: ["find", "magnifying glass", "lookup"],
  home: ["house"],
  alarm: ["clock", "timer", "bell", "notification"],
  notifications: ["bell", "alert", "notification"],
  bolt: ["lightning", "electric", "energy", "power"],
  check_circle: ["checkmark", "tick", "done", "success", "confirm"],
  close: ["cross", "cancel", "dismiss", "x"],
  palette: ["color", "colour", "paint"],
  play_arrow: ["play", "start", "video"],
  sync: ["refresh", "reload", "synchronize"],
  mail: ["email", "envelope", "message"],
  visibility: ["eye", "show", "visible"],
  lock: ["padlock", "secure", "security"],
  image: ["picture", "photo"],
  chat_bubble: ["message", "speech", "conversation"],
}

const symbolSearchScore = (name: string, query: string) => {
  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (name.includes(query)) return 2
  const base = name.replace(/_off$/, "")
  const terms = [name.replace(/_/g, " "), ...(SYMBOL_ALIASES[base] ?? [])].join(
    " "
  )
  return query.split("_").every((word) => terms.includes(word)) ? 3 : Infinity
}

const MATERIAL_WIPE_READY_PAIR_INDEX = MATERIAL_WIPE_READY_PAIRS.map(
  (pair) => ({
    pair,
    query: normalizeMaterialSymbolName(
      `${pair.label} ${pair.enabled} ${pair.disabled}`
    ),
  })
)

export const visibleMaterialSymbols = (
  names: string[],
  query: string,
  limit = 80
) => {
  const normalizedQuery = materialSymbolQuery(query)
  const source = names.length > 0 ? names : FALLBACK_MATERIAL_SYMBOL_NAMES
  const uniqueSource = Array.from(new Set(source))
  const filtered = normalizedQuery
    ? uniqueSource
        .map((name) => ({
          name,
          score: symbolSearchScore(name, normalizedQuery),
        }))
        .filter(({ score }) => Number.isFinite(score))
        .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
        .map(({ name }) => name)
    : uniqueSource
  return filtered.slice(0, limit)
}

export const visibleWipePairs = (
  query: string,
  limit = 24
): MaterialWipeIconPair[] => {
  const normalizedQuery = materialSymbolQuery(query)
  const filtered = normalizedQuery
    ? MATERIAL_WIPE_READY_PAIR_INDEX.filter(({ query }) =>
        query.includes(normalizedQuery)
      ).map(({ pair }) => pair)
    : MATERIAL_WIPE_READY_PAIRS
  return filtered.slice(0, limit)
}
