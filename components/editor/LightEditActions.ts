import type { EditorDocumentStore } from "./EditorDocumentStore"
import {
  type LightPosition,
  clampNumber,
  createEditorId,
  quantizeTimeToFrame,
} from "./EditorModel"
import {
  findKeyframeAtTime,
  previousEasingFor,
  upsertVectorKeyframeAtTime,
} from "./EditorKeyframeModel"

export const STATIC_STUDIO_LIGHTING = {
  ambientColor: "#ffffff",
  ambientIntensity: 0.6,
  rimLightColor: "#a48bff",
  rimLightIntensity: 0.8,
}

/** Light direction edits at `currentTime`. */
export function createLightEditActions({
  store,
  currentTime,
  activeKeyLightPosition,
}: {
  store: EditorDocumentStore
  currentTime: number
  /** The light direction shown at `currentTime`. */
  activeKeyLightPosition: LightPosition
}) {
  const playheadTime = () =>
    clampNumber(quantizeTimeToFrame(currentTime), 0, store.get().duration)

  return {
    toggleLightPositionKeyframeAtPlayhead: () => {
      const time = playheadTime()
      const keyframes = store.get().keyLightPositionKeyframes
      const existing = findKeyframeAtTime(keyframes, time)
      store.patch({
        activeRecipeId: null,
        keyLightPositionKeyframes: existing
          ? keyframes.filter((keyframe) => keyframe.id !== existing.id)
          : [
              ...keyframes,
              {
                id: createEditorId("light-position"),
                time,
                value: activeKeyLightPosition,
                easing: previousEasingFor(keyframes, time),
              },
            ].sort((a, b) => a.time - b.time),
      })
    },
    updateLightPositionXY: (x: number, y: number) => {
      const nextPosition = {
        ...activeKeyLightPosition,
        x: clampNumber(x, -12, 12),
        y: clampNumber(y, -12, 12),
      }
      store.patch({
        activeRecipeId: null,
        keyLightPosition: nextPosition,
        keyLightPositionKeyframes: upsertVectorKeyframeAtTime({
          keyframes: store.get().keyLightPositionKeyframes,
          idPrefix: "light-position",
          value: nextPosition,
          time: playheadTime(),
          duration: store.get().duration,
          createIfMissing: false,
        }),
      })
    },
  }
}
