import type { MaterialPresetId } from "../3d/MaterialPresets"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import {
  type MaterialSettingKey,
  type MaterialSettings,
  clampNumber,
} from "./EditorModel"
import { materialDefaultSettings } from "./FinishRegistry"
import {
  materialPlayheadTime,
  upsertMaterialKeyframe,
} from "./MaterialEditorModel"

/**
 * Finish edits at `currentTime`: they update the base finish and, once the
 * finish is keyframed, the keyframe there.
 */
export function createMaterialEditActions({
  store,
  currentTime,
  activeMaterialSettings,
}: {
  store: EditorDocumentStore
  currentTime: number
  /** The finish shown at `currentTime`. */
  activeMaterialSettings: MaterialSettings
}) {
  const keyedMaterialKeyframes = (value: MaterialSettings) => {
    const { materialKeyframes: keyframes, duration } = store.get()
    return keyframes.length === 0
      ? keyframes
      : upsertMaterialKeyframe({
          keyframes,
          time: materialPlayheadTime(currentTime, duration),
          value,
          createIfMissing: false,
        })
  }

  return {
    updateMaterialSetting: (
      key: MaterialSettingKey,
      value: number,
      min: number,
      max: number
    ) => {
      const clamped = clampNumber(value, min, max)
      store.patch({
        activeRecipeId: null,
        materialSettings: { ...store.get().materialSettings, [key]: clamped },
        materialKeyframes: keyedMaterialKeyframes({
          ...activeMaterialSettings,
          [key]: clamped,
        }),
      })
    },
    applyMaterialPreset: (preset: MaterialPresetId) => {
      const settings = materialDefaultSettings(preset)
      store.patch({
        activeRecipeId: null,
        materialPreset: preset,
        materialSettings: settings,
        materialKeyframes: keyedMaterialKeyframes(settings),
      })
    },
  }
}
