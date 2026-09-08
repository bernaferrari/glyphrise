import { describe, expect, it } from "vitest"
import type { EditorSnapshot } from "./EditorModel"
import {
  createProjectMetadata,
  editorProjectStorageKey,
  listPersistedEditorProjects,
  readCurrentEditorProjectId,
  readPersistedEditorProject,
  writePersistedEditorDocument,
  type EditorProjectStore,
} from "./EditorDocumentModel"
import { createProjectFromTemplateAction } from "./EditorProjectActivation"
import { MOTION_RECIPES } from "./MotionRecipes"
import { createBlankEditorSnapshot } from "./EditorProjectModel"
import { createEditorSnapshotFromRecipe } from "./RecipeModel"

const validSnapshot = (fillColor: string): EditorSnapshot => ({
  activeRecipeId: null,
  shapes: [
    {
      id: "clip-1",
      time: 0,
      iconId: "heart",
      iconName: "Heart",
      svgContent: `<svg viewBox="0 0 24 24"><path d="M0 0h10v10H0z"/></svg>`,
      color: "#ffaa00",
      colorSecondary: "#000000",
      easing: "ease-in-out",
      transitionType: "fade",
      wipeDirection: { x: 0, y: 0 },
    },
  ],
  duration: 5,
  materialPreset: "chrome",
  materialSettings: {
    roughness: 0.2,
    metalness: 0.5,
    reflectance: 0.8,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    transmission: 0,
    thickness: 0.4,
    emissiveIntensity: 0,
  },
  materialKeyframes: [],
  extrusionDepth: 18,
  bevelEnabled: true,
  bevelThickness: 0.12,
  bevelSize: 0.06,
  bevelSegments: 4,
  geometryQuality: 0.045,
  qualityKeyframes: [],
  layerSpacing: 0.16,
  innerElementScale: { x: 1, y: 1, z: 1 },
  innerScaleKeyframes: [],
  objectScale: 1.4,
  objectScaleAxes: { x: 1, y: 1, z: 1 },
  moveOffset: { x: 2, y: 0, z: 0 },
  moveKeyframes: [],
  enableGradient: false,
  fillMode: "solid",
  fillColor,
  fillColorSecondary: "#000000",
  fillGradientType: "linear",
  fillStops: [],
  fillKeyframes: [],
  rotationOffset: { x: 10, y: 0, z: 0 },
  rotationAxisKeyframes: [],
  keyLightColor: "#ffffff",
  keyLightIntensity: 1,
  keyLightPosition: { x: 5, y: 5, z: 4 },
  keyLightSoftness: 0.35,
  keyLightPositionKeyframes: [],
  tracks: [],
})

const createMemoryStorage = (): EditorProjectStore & Storage => {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, String(value))
    },
  }
}

const cloneStorage = (source: EditorProjectStore): EditorProjectStore => {
  const next = createMemoryStorage()
  for (let index = 0; index < (source as Storage).length; index += 1) {
    const key = (source as Storage).key(index)
    if (!key) continue
    const value = source.getItem(key)
    if (value !== null) next.setItem(key, value)
  }
  return next
}

const failingStore = (source: EditorProjectStore, failOnWrite: number) => {
  const store = cloneStorage(source)
  let writes = 0
  const setItem = store.setItem.bind(store)
  store.setItem = (key, value) => {
    writes += 1
    if (writes === failOnWrite) {
      throw new Error(`storage write ${failOnWrite} failed`)
    }
    setItem(key, value)
  }
  return store
}

describe("createProjectFromTemplateAction", () => {
  const recipe = MOTION_RECIPES[0]

  it("leaves a customized project and its Undo stack unchanged when any write fails", () => {
    const baseline = createMemoryStorage()
    const first = validSnapshot("#111111")
    const second = validSnapshot("#222222")
    const customized = validSnapshot("#abcdef")
    const previous = createProjectMetadata("Customized project")
    writePersistedEditorDocument(customized, previous, baseline)
    const undoStack = [first, second, customized]
    const outgoing = { snapshot: customized, project: previous }

    for (let failOnWrite = 1; failOnWrite <= 4; failOnWrite += 1) {
      const store = failingStore(baseline, failOnWrite)
      const failed = createProjectFromTemplateAction({
        baseSnapshot: customized,
        recipe,
        name: "Templated",
        outgoing,
        undoStack,
        store,
      })

      expect(failed.ok).toBe(false)
      expect(failed.undoStack).toEqual(undoStack)
      expect(failed.snapshot).toEqual(customized)
      expect(failed.project.id).toBe(previous.id)
      expect(failed.actionError?.surface).toBe("projects-dialog")
      expect(failed.actionError?.action).toBe("create")
      expect(failed.actionError?.message).toContain("Could not create")
      expect(readCurrentEditorProjectId(store)).toBe(previous.id)
      expect(readPersistedEditorProject(previous.id, store)?.snapshot).toEqual(
        customized
      )
    }
  })

  it("creates the intended template project on retry without mutating the previous one", () => {
    const store = createMemoryStorage()
    const customized = validSnapshot("#abcdef")
    const previous = createProjectMetadata("Customized project")
    writePersistedEditorDocument(customized, previous, store)
    const undoStack = [
      validSnapshot("#111111"),
      validSnapshot("#222222"),
      customized,
    ]

    const created = createProjectFromTemplateAction({
      baseSnapshot: customized,
      recipe,
      name: "Templated",
      outgoing: { snapshot: customized, project: previous },
      undoStack,
      store,
    })

    expect(created.ok).toBe(true)
    expect(created.project.id).not.toBe(previous.id)
    expect(created.undoStack).toEqual([created.snapshot])
    expect(created.actionError).toBeNull()
    expect(created.snapshot.activeRecipeId).toBe(recipe.id)
    expect(created.snapshot.fillColor).toBe(recipe.colorA)
    expect(created.snapshot.materialPreset).toBe(recipe.materialPreset)
    expect(readCurrentEditorProjectId(store)).toBe(created.project.id)
    expect(readPersistedEditorProject(previous.id, store)?.snapshot).toEqual(
      customized
    )
    expect(
      readPersistedEditorProject(created.project.id, store)?.snapshot
        .activeRecipeId
    ).toBe(recipe.id)

    const expected = createEditorSnapshotFromRecipe(
      createBlankEditorSnapshot(customized),
      recipe
    )
    expect(created.snapshot.activeRecipeId).toBe(expected.activeRecipeId)
    expect(created.snapshot.tracks.map((track) => track.id)).toEqual(
      expected.tracks.map((track) => track.id)
    )
    expect(
      listPersistedEditorProjects(store).map((project) => project.id)
    ).toContain(previous.id)
    expect(store.getItem(editorProjectStorageKey(previous.id))).not.toBeNull()
  })
})
