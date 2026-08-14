"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { MOTION_RECIPES, type MotionRecipe } from "./MotionRecipes"
import type { QuickStartGuideProps } from "./QuickStartGuide"

const QUICK_START_STORAGE_KEY = "vectorforge:quick-start:v1"
const QUICK_START_EXPORT_KEY = "vectorforge:quick-start:exported:v1"

export function useQuickStartGuideController({
  selectedShapeId,
  setOpenShapePicker,
  isPlaying,
  togglePlayback,
  applyRecipe,
  hasCustomizedIcon,
  hasStyle,
  hasMotion,
  onExport,
}: {
  selectedShapeId: string | null
  setOpenShapePicker: Dispatch<SetStateAction<string | null>>
  isPlaying: boolean
  togglePlayback: () => void
  applyRecipe: (recipe: MotionRecipe) => void
  hasCustomizedIcon: boolean
  hasStyle: boolean
  hasMotion: boolean
  onExport: () => void
}): {
  openGuide: () => void
  quickStartProps: QuickStartGuideProps
} {
  const [open, setOpen] = useState(false)
  const [exportVisited, setExportVisited] = useState(false)

  useEffect(() => {
    setOpen(
      window.localStorage.getItem(QUICK_START_STORAGE_KEY) !== "dismissed"
    )
    setExportVisited(
      window.localStorage.getItem(QUICK_START_EXPORT_KEY) === "visited"
    )
  }, [])

  const dismiss = useCallback(() => {
    window.localStorage.setItem(QUICK_START_STORAGE_KEY, "dismissed")
    setOpen(false)
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
        exportVisited ? "export" : null,
      ].filter((value): value is string => value !== null),
    [exportVisited, hasCustomizedIcon, hasMotion, hasStyle]
  )

  return {
    openGuide: () => setOpen(true),
    quickStartProps: {
      open,
      completedStepIds,
      onChooseIcon: () => {
        if (!selectedShapeId) return
        setOpen(false)
        setOpenShapePicker(selectedShapeId)
      },
      onStyle: () => {
        setOpen(false)
        requestAnimationFrame(() => {
          document
            .getElementById("inspector-style")
            ?.scrollIntoView({ block: "start" })
        })
      },
      onMotion: () => {
        setOpen(false)
        requestAnimationFrame(() => {
          document.getElementById("timeline-add-property")?.focus()
        })
      },
      onPlayExample: () => {
        setOpen(false)
        if (!isPlaying) togglePlayback()
      },
      onExport: () => {
        window.localStorage.setItem(QUICK_START_EXPORT_KEY, "visited")
        setExportVisited(true)
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
