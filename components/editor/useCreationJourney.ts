import { useEffect, useState } from "react"
import { readCurrentEditorProjectId } from "./EditorDocumentModel"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import type { EditorSnapshot } from "./EditorModel"

// Preserve the existing opt-out when upgrading the earlier quick-start UI.
const WELCOME_STORAGE_KEY = "glyphrise:quick-start:v1"

/** Edits that count as styling the icon for the guide's "Style it" step. */
const STYLE_FIELDS: Array<keyof EditorSnapshot> = [
  "fillMode",
  "enableGradient",
  "fillColor",
  "fillColorSecondary",
  "fillGradientType",
  "fillStops",
  "materialPreset",
  "materialSettings",
  "extrusionDepth",
  "bevelEnabled",
  "bevelThickness",
  "bevelSize",
  "bevelSegments",
  "keyLightColor",
  "keyLightIntensity",
  "keyLightSoftness",
]
const changed = (
  fields: Array<keyof EditorSnapshot>,
  next: EditorSnapshot,
  previous: EditorSnapshot
) => fields.some((field) => next[field] !== previous[field])

/**
 * The first-icon guide. Motion is done once the icon moves (starters already
 * do); styling completes on the person's own edits in this session, so
 * opening, restoring or undoing into a styled document doesn't count.
 */
export function useCreationJourney({
  store,
  projectId,
  keyframeCount,
  isPlaying,
  togglePlayback,
  onExport,
}: {
  store: EditorDocumentStore
  projectId: string
  keyframeCount: number
  isPlaying: boolean
  togglePlayback: () => void
  onExport: () => void
}) {
  const [hasStyle, setHasStyle] = useState(false)
  useEffect(() => setHasStyle(false), [projectId])
  useEffect(
    () =>
      store.onChange(({ next, previous, origin }) => {
        if (origin === "edit" && changed(STYLE_FIELDS, next, previous))
          setHasStyle(true)
      }),
    [store]
  )
  const hasMotion = keyframeCount > 0

  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const [exportCompleted, setExportCompleted] = useState(false)
  const [returningUser] = useState(
    () => typeof window !== "undefined" && Boolean(readCurrentEditorProjectId())
  )

  useEffect(() => {
    setWelcomeOpen(
      !returningUser &&
        window.localStorage.getItem(WELCOME_STORAGE_KEY) !== "dismissed"
    )
  }, [returningUser])
  useEffect(() => {
    setExportCompleted(false)
    setHasPreviewed(false)
  }, [projectId])
  useEffect(() => {
    if (isPlaying && hasMotion) setHasPreviewed(true)
  }, [isPlaying, hasMotion])

  return {
    welcomeOpen,
    hasStyle,
    hasMotion,
    hasPreviewed,
    exportCompleted,
    dismissWelcome: () => {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, "dismissed")
      setWelcomeOpen(false)
    },
    markExportComplete: () => setExportCompleted(true),
    playPreview: () => {
      if (!isPlaying) togglePlayback()
    },
    openExport: onExport,
  }
}

export type CreationJourney = ReturnType<typeof useCreationJourney>
