import type { EditorDocumentStore } from "./EditorDocumentStore"
import {
  type FillGradientType,
  interpolateFillKeyframes,
} from "./TimelineModel"
import { upsertFillKeyframe } from "./FillEditorModel"
import {
  makeFillStops,
  normalizeFillStops,
  stopsForGradientType,
} from "./FillStopModel"
import { clampNumber, quantizeTimeToFrame } from "./EditorModel"

/**
 * Fill edits at `currentTime`: they change the base fill, and once Fill is
 * keyframed, the keyframe there too (an animated fill never grows keys from
 * colour edits alone).
 */
export const createFillEditActions = ({
  store,
  currentTime,
}: {
  store: EditorDocumentStore
  currentTime: number
}) => {
  const playheadTime = () =>
    clampNumber(quantizeTimeToFrame(currentTime), 0, store.get().duration)

  const activeFill = () => {
    const fill = store.get()
    return interpolateFillKeyframes(
      currentTime,
      {
        color: fill.fillColor,
        colorSecondary: fill.fillColorSecondary,
        gradientType: fill.fillGradientType,
        stops: fill.fillStops,
      },
      fill.fillKeyframes
    )
  }

  const keyedFillKeyframes = (
    stops: ReturnType<typeof makeFillStops>,
    gradientType: FillGradientType
  ) => {
    const { fillKeyframes } = store.get()
    return fillKeyframes.length === 0
      ? fillKeyframes
      : upsertFillKeyframe({
          keyframes: fillKeyframes,
          time: playheadTime(),
          patch: { stops, gradientType },
          createIfMissing: false,
        })
  }

  const setGradientEnabled = (enabled: boolean) => {
    store.patch({
      fillMode: enabled ? "gradient" : "solid",
      enableGradient: enabled,
      activeRecipeId: null,
    })
  }

  const updateFillColor = (value: string, secondary = false) => {
    const { fillMode, fillGradientType, fillKeyframes } = store.get()
    const active = activeFill()
    const nextColor = secondary ? active.color : value
    const nextStops = makeFillStops(
      nextColor,
      secondary ? value : active.colorSecondary,
      fillMode === "solid",
      [active.stops?.[0]?.position ?? 0, active.stops?.[1]?.position ?? 1]
    )
    store.patch({
      activeRecipeId: null,
      fillColor: nextColor,
      fillColorSecondary: nextStops[1].color,
      ...(fillKeyframes.length === 0
        ? { fillStops: fillMode === "gradient" ? nextStops : undefined }
        : { fillKeyframes: keyedFillKeyframes(nextStops, fillGradientType) }),
    })
  }

  const updateGradientType = (gradientType: FillGradientType) => {
    const nextStops = stopsForGradientType(
      activeFill(),
      gradientType,
      store.get().fillMode === "solid"
    )
    const nextColor = nextStops[0]?.color ?? activeFill().color
    store.patch({
      activeRecipeId: null,
      fillColor: nextColor,
      fillColorSecondary: nextStops[1]?.color ?? nextColor,
      fillGradientType: gradientType,
      fillStops: nextStops,
      fillKeyframes: keyedFillKeyframes(nextStops, gradientType),
    })
  }

  const updateFillStops = (
    stops: Array<{ id?: string; color: string; position: number }>
  ) => {
    const nextStops = normalizeFillStops(stops)
    if (nextStops.length === 0) return
    const { fillColor, fillColorSecondary, fillGradientType } = store.get()
    store.patch({
      activeRecipeId: null,
      fillColor: nextStops[0]?.color ?? fillColor,
      fillColorSecondary:
        nextStops[1]?.color ?? nextStops[0]?.color ?? fillColorSecondary,
      fillStops: nextStops,
      fillKeyframes: keyedFillKeyframes(nextStops, fillGradientType),
    })
  }

  return {
    setGradientEnabled,
    updateFillColor,
    updateGradientType,
    updateFillStops,
  }
}
