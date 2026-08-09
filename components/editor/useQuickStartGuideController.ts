"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { MOTION_RECIPES, type MotionRecipe } from "./MotionRecipes"
import type { QuickStartGuideProps } from "./QuickStartGuide"

const QUICK_START_STORAGE_KEY = "vectorforge:quick-start:v1"

export function useQuickStartGuideController({
  selectedShapeId,
  setOpenShapePicker,
  isPlaying,
  togglePlayback,
  applyRecipe,
}: {
  selectedShapeId: string | null
  setOpenShapePicker: Dispatch<SetStateAction<string | null>>
  isPlaying: boolean
  togglePlayback: () => void
  applyRecipe: (recipe: MotionRecipe) => void
}): {
  openGuide: () => void
  quickStartProps: QuickStartGuideProps
} {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(
      window.localStorage.getItem(QUICK_START_STORAGE_KEY) !== "dismissed"
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

  return {
    openGuide: () => setOpen(true),
    quickStartProps: {
      open,
      onChooseIcon: () => {
        dismiss()
        if (selectedShapeId) setOpenShapePicker(selectedShapeId)
      },
      onPlayExample: () => {
        dismiss()
        if (!isPlaying) togglePlayback()
      },
      templates,
      onTemplateChoose: (recipeId) => {
        const recipe = MOTION_RECIPES.find(
          (candidate) => candidate.id === recipeId
        )
        if (!recipe) return
        applyRecipe(recipe)
        dismiss()
      },
      onDismiss: dismiss,
    },
  }
}
