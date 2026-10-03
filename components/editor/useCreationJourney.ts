import { useEffect, useMemo, useState } from "react"
import { MOTION_RECIPES } from "./MotionRecipes"
import { MATERIAL_PREVIEW } from "./FinishRegistry"
import { readCurrentEditorProjectId } from "./EditorDocumentModel"

// Preserve the existing opt-out when upgrading the earlier quick-start UI.
const WELCOME_STORAGE_KEY = "glyphrise:quick-start:v1"

export function useCreationJourney({
  projectId,
  isPlaying,
  togglePlayback,
  hasStyle,
  hasMotion,
  onExport,
}: {
  projectId: string
  isPlaying: boolean
  togglePlayback: () => void
  hasStyle: boolean
  hasMotion: boolean
  onExport: () => void
}) {
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

  const templates = useMemo(
    () =>
      MOTION_RECIPES.slice(0, 3).map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        preview: MATERIAL_PREVIEW[recipe.materialPreset],
      })),
    []
  )

  return {
    welcomeOpen,
    hasStyle,
    hasMotion,
    hasPreviewed,
    exportCompleted,
    templates,
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
