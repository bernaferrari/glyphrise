import { useCallback, useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { MOTION_RECIPES, type MotionRecipe } from "./MotionRecipes"
import type { QuickStartGuideProps } from "./QuickStartGuide"

const QUICK_START_STORAGE_KEY = "glyphrise:quick-start:v1"

export type QuickStartGuideController = {
  openGuide: () => void
  dismissedRecently: boolean
  markExportComplete: () => void
  quickStartProps: QuickStartGuideProps
}

export function useQuickStartGuideController({
  projectId,
  selectedShapeId,
  setOpenShapePicker,
  fallbackShapeId,
  isPlaying,
  togglePlayback,
  applyRecipe,
  hasCustomizedIcon,
  hasStyle,
  hasMotion,
  onExport,
}: {
  projectId: string
  selectedShapeId: string | null
  setOpenShapePicker: Dispatch<SetStateAction<string | null>>
  fallbackShapeId: string | null
  isPlaying: boolean
  togglePlayback: () => void
  applyRecipe: (recipe: MotionRecipe) => void
  hasCustomizedIcon: boolean
  hasStyle: boolean
  hasMotion: boolean
  onExport: () => void
}): QuickStartGuideController {
  const [open, setOpen] = useState(false)
  const [hasPreviewed, setHasPreviewed] = useState(false)
  const [exportCompleted, setExportCompleted] = useState(false)
  const [dismissedRecently, setDismissedRecently] = useState(false)

  useEffect(() => {
    setOpen(
      window.localStorage.getItem(QUICK_START_STORAGE_KEY) !== "dismissed"
    )
  }, [])

  useEffect(() => {
    setExportCompleted(false)
    setHasPreviewed(false)
  }, [projectId])

  useEffect(() => {
    if (isPlaying && hasMotion) setHasPreviewed(true)
  }, [isPlaying, hasMotion])

  const dismiss = useCallback(() => {
    window.localStorage.setItem(QUICK_START_STORAGE_KEY, "dismissed")
    setOpen(false)
    // Session-local: lets the layout offer a subtle reopen affordance.
    setDismissedRecently(true)
  }, [])

  const templates = useMemo(
    () =>
      MOTION_RECIPES.slice(0, 3).map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        emoji: recipe.emoji,
      })),
    []
  )
  const completedStepIds = useMemo(
    () =>
      [
        hasCustomizedIcon ? "icon" : null,
        hasStyle ? "style" : null,
        hasMotion ? "motion" : null,
        exportCompleted ? "export" : null,
      ].filter((value): value is string => value !== null),
    [exportCompleted, hasCustomizedIcon, hasMotion, hasStyle]
  )
  return {
    openGuide: () => {
      setOpen(true)
      setDismissedRecently(false)
    },
    dismissedRecently,
    markExportComplete: () => setExportCompleted(true),
    quickStartProps: {
      open,
      completedStepIds,
      hasPreviewed,
      onChooseIcon: () => {
        // Timeline property-row selection can clear the shape selection;
        // fall back to the first shape so the picker still opens.
        const shapeId = selectedShapeId ?? fallbackShapeId
        if (!shapeId) return
        setOpenShapePicker(shapeId)
      },
      onStyle: () => {
        requestAnimationFrame(() => {
          document
            .getElementById("inspector-style")
            ?.scrollIntoView({ block: "start" })
        })
      },
      onMotion: () => {
        requestAnimationFrame(() => {
          document.getElementById("timeline-add-property")?.focus()
        })
      },
      onPlayExample: () => {
        setHasPreviewed(true)
        // Playback is an explicit step in the walkthrough.
        if (!isPlaying) togglePlayback()
      },
      onExport: () => {
        // Opening the surface is not enough; the step completes only on a
        // real export action (see markExportComplete).
        onExport()
      },
      templates,
      onTemplateChoose: (recipeId) => {
        const recipe = MOTION_RECIPES.find(
          (candidate) => candidate.id === recipeId
        )
        if (!recipe) return
        applyRecipe(recipe)
      },
      onDismiss: dismiss,
    },
  }
}
