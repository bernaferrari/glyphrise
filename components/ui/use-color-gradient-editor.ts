"use client"

import * as React from "react"
import { bindWindowPointerDrag } from "@/lib/drag-events"
import { meshNodePoints } from "../../lib/mesh-warp"
import { parseHexColorInput } from "./color-picker-utils"
import {
  createGradientStopAtPoint,
  createGradientStopAtPosition,
  findInsertedGradientStopIndex,
  gradientRailPointFromClient,
  gradientEditorPreviewCss,
  addMeshFreePoint,
  insertGradientStop,
  meshEditorStops,
  normalizedGradientPosition,
  parseGradientStopPositionInput,
  removeGradientStopAt,
  removeMeshPointAt,
  reorderMeshColors,
  updateGradientStopColorById,
  updateGradientStopPositionById,
} from "./color-gradient-editor-model"
import {
  hueShiftedStops,
  remixedMesh,
  type GradientPreset,
} from "./color-gradient-presets"
import type { GradientType } from "./color-gradient-mode-toggle"
import {
  fallbackColorStops,
  normalizeColorStops,
  type EditableColorStop,
} from "./color-stop-model"
import { useColorStopEditorState } from "./use-color-stop-editor-state"

type UseColorGradientEditorArgs = {
  value: string
  primaryHex: string
  secondaryHex: string
  isOpen: boolean
  isGradient: boolean
  gradientType: GradientType
  stops?: EditableColorStop[]
  hasSecondary: boolean
  onChange: (hex: string) => void
  onGradientToggle?: (on: boolean) => void
  onGradientTypeChange?: (type: GradientType) => void
  onSecondaryChange?: (hex: string) => void
  onStopsChange?: (stops: EditableColorStop[]) => void
  onStopPositionChange?: (stop: number, position: number) => void
}

const HUE_TAP_STEP = 60
const HUE_DEGREES_PER_PIXEL = 1.5

export function useColorGradientEditor({
  value,
  primaryHex,
  secondaryHex,
  isOpen,
  isGradient,
  gradientType,
  stops,
  hasSecondary,
  onChange,
  onGradientToggle,
  onGradientTypeChange,
  onSecondaryChange,
  onStopsChange,
  onStopPositionChange,
}: UseColorGradientEditorArgs) {
  const gradientRailRef = React.useRef<HTMLDivElement>(null)

  const isMesh = isGradient && gradientType === "mesh"
  const normalizedStops = React.useMemo(() => {
    const normalized = normalizeColorStops(
      fallbackColorStops({
        stops,
        primaryHex,
        secondaryHex,
        hasSecondary,
      })
    )
    return isMesh ? meshEditorStops(normalized, primaryHex) : normalized
  }, [hasSecondary, isMesh, primaryHex, secondaryHex, stops])

  const {
    activeStop,
    closeStopEditor,
    markStopEditorOpenIntent,
    openStopEditor,
    openStopEditorAnchor,
    openingStopEditorRef,
    setActiveStop,
    setOpenStopEditor,
    setOpenStopEditorAnchor,
    setOpenStopEditorState,
  } = useColorStopEditorState({
    isOpen,
    isGradient,
    stopCount: normalizedStops.length,
  })

  const updateStops = React.useCallback(
    (nextStops: EditableColorStop[]) => {
      onStopsChange?.(normalizeColorStops(nextStops))
    },
    [onStopsChange]
  )

  const closeStopEditorAfterGradientMutation = React.useCallback(() => {
    setOpenStopEditor(null)
    setOpenStopEditorAnchor(null)
  }, [])

  const applyGradientPreset = React.useCallback(
    (preset: GradientPreset) => {
      onGradientToggle?.(true)
      onGradientTypeChange?.(preset.type)
      updateStops(preset.stops)
      setActiveStop(0)
      closeStopEditorAfterGradientMutation()
    },
    [
      closeStopEditorAfterGradientMutation,
      onGradientToggle,
      onGradientTypeChange,
      updateStops,
    ]
  )

  const remixMeshStops = React.useCallback(() => {
    onGradientToggle?.(true)
    onGradientTypeChange?.("mesh")
    updateStops(remixedMesh(normalizedStops))
    closeStopEditorAfterGradientMutation()
  }, [
    closeStopEditorAfterGradientMutation,
    normalizedStops,
    onGradientToggle,
    onGradientTypeChange,
    updateStops,
  ])

  const shiftHueStep = React.useCallback(() => {
    updateStops(hueShiftedStops(normalizedStops, HUE_TAP_STEP))
  }, [normalizedStops, updateStops])

  /**
   * Tap spins every hue a step around the wheel; drag sideways scrubs it
   * live from the colors as they were when the drag began.
   */
  const handleHuePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const base = normalizedStops
      const startX = e.clientX
      let moved = false
      closeStopEditorAfterGradientMutation()
      bindWindowPointerDrag({
        documentEdit: true,
        pointerId: e.pointerId,
        onMove: (event) => {
          const dx = event.clientX - startX
          if (!moved && Math.abs(dx) < 3) return
          moved = true
          updateStops(hueShiftedStops(base, dx * HUE_DEGREES_PER_PIXEL))
        },
        onEnd: (event) => {
          if (!moved && event?.type !== "pointercancel")
            updateStops(hueShiftedStops(base, HUE_TAP_STEP))
        },
      })
    },
    [closeStopEditorAfterGradientMutation, normalizedStops, updateStops]
  )

  const updateActiveStopColor = React.useCallback(
    (nextColor: string) => {
      if (onStopsChange) {
        updateStops(
          normalizedStops.map((stop, index) =>
            index === activeStop ? { ...stop, color: nextColor } : stop
          )
        )
        return
      }
      if (isGradient && activeStop === 1 && onSecondaryChange)
        onSecondaryChange(nextColor)
      else onChange(nextColor)
    },
    [
      activeStop,
      isGradient,
      normalizedStops,
      onChange,
      onSecondaryChange,
      onStopsChange,
      updateStops,
    ]
  )

  const gradientCss = React.useMemo(() => {
    return gradientEditorPreviewCss({
      gradientType,
      stops: normalizedStops,
      fallback: primaryHex,
    })
  }, [gradientType, normalizedStops, primaryHex])

  const updateStopPosition = React.useCallback(
    (stopId: string, nextPosition: number) => {
      const position = normalizedGradientPosition(nextPosition)
      const previousIndex = normalizedStops.findIndex(
        (stop) => stop.id === stopId
      )
      if (previousIndex < 0) return
      if (onStopsChange) {
        const nextStops = updateGradientStopPositionById(
          normalizedStops,
          stopId,
          position
        )
        updateStops(nextStops)
        const nextIndex = nextStops.findIndex((stop) => stop.id === stopId)
        setActiveStop(Math.max(0, nextIndex))
        setOpenStopEditor((open) =>
          open === previousIndex ? Math.max(0, nextIndex) : open
        )
      }
      onStopPositionChange?.(previousIndex, position)
    },
    [normalizedStops, onStopPositionChange, onStopsChange, updateStops]
  )

  const updateStopColor = React.useCallback(
    (stopId: string, nextColor: string) => {
      const stopIndex = normalizedStops.findIndex((stop) => stop.id === stopId)
      if (stopIndex < 0) return
      setActiveStop(stopIndex)
      if (onStopsChange) {
        updateStops(
          updateGradientStopColorById(normalizedStops, stopId, nextColor)
        )
        return
      }
      if (isGradient && stopIndex === 1 && onSecondaryChange)
        onSecondaryChange(nextColor)
      else onChange(nextColor)
    },
    [
      isGradient,
      normalizedStops,
      onChange,
      onSecondaryChange,
      onStopsChange,
      updateStops,
    ]
  )

  const handleStopDrag = React.useCallback(
    (stopId: string, clientX: number) => {
      if (!gradientRailRef.current) return
      const rect = gradientRailRef.current.getBoundingClientRect()
      const { x: position } = gradientRailPointFromClient({ rect, clientX })
      updateStopPosition(stopId, position)
    },
    [updateStopPosition]
  )

  const handleStopPointerDown = React.useCallback(
    (stop: number, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const stopId = normalizedStops[stop]?.id
      if (!stopId) return
      markStopEditorOpenIntent()
      const startX = e.clientX
      let moved = false
      setActiveStop(stop)
      bindWindowPointerDrag({
        documentEdit: true,
        onMove: (event) => {
          if (!moved && Math.abs(event.clientX - startX) < 3) return
          moved = true
          handleStopDrag(stopId, event.clientX)
        },
        onEnd: () => {
          if (!moved) {
            window.setTimeout(() => {
              setActiveStop(stop)
              setOpenStopEditor(stop)
              setOpenStopEditorAnchor("rail")
              openingStopEditorRef.current = false
            }, 0)
          } else {
            openingStopEditorRef.current = false
          }
        },
      })
    },
    [handleStopDrag, markStopEditorOpenIntent, normalizedStops]
  )

  const commitStopPositionInput = React.useCallback(
    (stopId: string, rawValue: string) => {
      const position = parseGradientStopPositionInput(rawValue)
      if (position === null) return
      updateStopPosition(stopId, position)
    },
    [updateStopPosition]
  )

  const commitStopColorInput = React.useCallback(
    (stopId: string, rawValue: string, input?: HTMLInputElement) => {
      const nextColor = parseHexColorInput(rawValue)
      if (!nextColor) {
        const currentColor = normalizedStops.find(
          (stop) => stop.id === stopId
        )?.color
        if (input && currentColor)
          input.value = currentColor.replace(/^#/, "").toUpperCase()
        return
      }
      updateStopColor(stopId, nextColor)
      if (input) input.value = nextColor.replace(/^#/, "")
    },
    [normalizedStops, updateStopColor]
  )

  const addStopAtRailPosition = React.useCallback(
    (clientX: number, clientY?: number) => {
      if (!gradientRailRef.current || !onStopsChange) return
      const rect = gradientRailRef.current.getBoundingClientRect()
      const point = gradientRailPointFromClient({ rect, clientX, clientY })
      const nextStop = createGradientStopAtPoint({
        gradientType,
        stops: normalizedStops,
        point,
        fallback: primaryHex,
      })
      const nextStops = insertGradientStop(normalizedStops, nextStop)
      const nextIndex = findInsertedGradientStopIndex(nextStops, nextStop)
      updateStops(nextStops)
      setActiveStop(Math.max(0, nextIndex))
      setOpenStopEditor(Math.max(0, nextIndex))
      setOpenStopEditorAnchor("rail")
    },
    [gradientType, normalizedStops, onStopsChange, primaryHex, updateStops]
  )

  const addStopAtMiddle = React.useCallback(() => {
    const position = 0.5
    const nextStop = createGradientStopAtPosition({
      stops: normalizedStops,
      position,
      fallback: primaryHex,
    })
    const nextStops = insertGradientStop(normalizedStops, nextStop)
    updateStops(nextStops)
    const nextIndex = findInsertedGradientStopIndex(nextStops, nextStop)
    setActiveStop(Math.max(0, nextIndex))
    setOpenStopEditor(Math.max(0, nextIndex))
    setOpenStopEditorAnchor("rail")
  }, [normalizedStops, primaryHex, updateStops])

  const removeStop = React.useCallback(
    (index: number) => {
      updateStops(
        isMesh
          ? removeMeshPointAt(normalizedStops, index)
          : removeGradientStopAt(normalizedStops, index)
      )
      closeStopEditorAfterGradientMutation()
    },
    [closeStopEditorAfterGradientMutation, isMesh, normalizedStops, updateStops]
  )

  const reorderMeshPoints = React.useCallback(
    (from: number, to: number) => {
      updateStops(reorderMeshColors(normalizedStops, from, to))
      setActiveStop(to)
      closeStopEditorAfterGradientMutation()
    },
    [closeStopEditorAfterGradientMutation, normalizedStops, updateStops]
  )

  /** Drag a mesh node anywhere; the other eight keep their spots. */
  const moveMeshPoint = React.useCallback(
    (index: number, x: number, y: number) => {
      const points = meshNodePoints(normalizedStops)
      updateStops(
        normalizedStops.map((stop, stopIndex) =>
          stopIndex === index
            ? { ...stop, x, y }
            : stopIndex < 9
              ? { ...stop, ...points[stopIndex] }
              : stop
        )
      )
    },
    [normalizedStops, updateStops]
  )

  const addMeshPoint = React.useCallback(
    (point?: { x: number; y: number }) => {
      // Default spot: the emptiest of a few candidates, so a new point is
      // easy to see and grab.
      const taken = [
        ...meshNodePoints(normalizedStops),
        ...normalizedStops.slice(9).map((stop) => ({
          x: stop.x ?? 0.5,
          y: stop.y ?? 0.5,
        })),
      ]
      const candidates = [
        { x: 0.25, y: 0.25 },
        { x: 0.75, y: 0.25 },
        { x: 0.25, y: 0.75 },
        { x: 0.75, y: 0.75 },
        { x: 0.5, y: 0.35 },
        { x: 0.5, y: 0.65 },
      ]
      const spot =
        point ??
        candidates.reduce((best, candidate) => {
          const room = (spot: { x: number; y: number }) =>
            Math.min(
              ...taken.map((other) =>
                Math.hypot(other.x - spot.x, other.y - spot.y)
              )
            )
          return room(candidate) > room(best) ? candidate : best
        })
      const nextStops = addMeshFreePoint(normalizedStops, spot, primaryHex)
      updateStops(nextStops)
      setActiveStop(nextStops.length - 1)
    },
    [normalizedStops, primaryHex, updateStops]
  )

  const resetMeshPoints = React.useCallback(() => {
    updateStops(
      normalizedStops.map((stop, index) => {
        if (index >= 9) return stop
        const { x: _x, y: _y, ...rest } = stop
        return rest
      })
    )
  }, [normalizedStops, updateStops])

  return {
    activeStop,
    activeValue: normalizedStops[activeStop]?.color ?? value,
    addStopAtMiddle,
    addStopAtRailPosition,
    applyGradientPreset,
    canRemoveStop: normalizedStops.length > (isMesh ? 2 : 1),
    closeStopEditor,
    commitStopColorInput,
    commitStopPositionInput,
    gradientCss,
    gradientRailRef,
    handleStopPointerDown,
    markStopEditorOpenIntent,
    normalizedStops,
    openStopEditor,
    openStopEditorAnchor,
    openingStopEditorRef,
    removeStop,
    setActiveStop,
    setOpenStopEditor,
    setOpenStopEditorAnchor,
    setOpenStopEditorState,
    handleHuePointerDown,
    remixMeshStops,
    shiftHueStep,
    addMeshPoint,
    moveMeshPoint,
    reorderMeshPoints,
    resetMeshPoints,
    updateActiveStopColor,
  }
}
