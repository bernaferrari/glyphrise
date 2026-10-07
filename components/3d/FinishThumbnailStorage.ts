import { isMaterialPresetId, type MaterialPresetId } from "./MaterialPresets"

// Bump this version when the preview stage or finish rendering changes.
const STORAGE_KEY = "glyphrise:finish-thumbnails:v2"
const MAX_STORED_SIZE = 512_000
export type StoredFinishThumbnails = {
  fillKey: string
  thumbnails: Partial<Record<MaterialPresetId, string>>
}

/** Only the latest fill is persisted, keeping this optional cache small. */
export function readStoredFinishThumbnails(): StoredFinishThumbnails | null {
  if (typeof window === "undefined") return null
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY)
    if (!serialized || serialized.length > MAX_STORED_SIZE) return null
    const record = JSON.parse(serialized)
    if (
      typeof record?.fillKey !== "string" ||
      !record.thumbnails ||
      typeof record.thumbnails !== "object"
    )
      return null
    const thumbnails: StoredFinishThumbnails["thumbnails"] = {}
    for (const [preset, url] of Object.entries(record.thumbnails)) {
      if (
        isMaterialPresetId(preset) &&
        typeof url === "string" &&
        url.startsWith("data:image/png;base64,")
      )
        thumbnails[preset] = url
    }
    return { fillKey: record.fillKey, thumbnails }
  } catch {
    return null
  }
}

export function writeStoredFinishThumbnails(record: StoredFinishThumbnails) {
  if (typeof window === "undefined") return
  try {
    const serialized = JSON.stringify(record)
    if (serialized.length <= MAX_STORED_SIZE)
      window.localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    // Private browsing and a full storage quota must not affect the editor.
  }
}
