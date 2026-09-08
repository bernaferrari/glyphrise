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
import {
  flushAutosaveIfAllowed,
  persistCurrentProjectDeletion,
  readRestoredEditorDocument,
} from "./EditorProjectActivation"
import { createBlankEditorSnapshot } from "./EditorProjectModel"

const validSnapshot = (fillColor: string): EditorSnapshot => ({
  activeRecipeId: null,
  shapes: [
    {
      id: "clip-1",
      time: 0,
      iconId: "heart",
      iconName: "Heart",
      svgContent: `<svg viewBox="0 0 24 24"><path d="M0 0h10v10H0z"/></svg>`,
      color: "#ffffff",
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
  extrusionDepth: 10,
  bevelEnabled: true,
  bevelThickness: 0.12,
  bevelSize: 0.06,
  bevelSegments: 4,
  geometryQuality: 0.045,
  qualityKeyframes: [],
  layerSpacing: 0.16,
  innerElementScale: { x: 1, y: 1, z: 1 },
  innerScaleKeyframes: [],
  objectScale: 1,
  objectScaleAxes: { x: 1, y: 1, z: 1 },
  moveOffset: { x: 0, y: 0, z: 0 },
  moveKeyframes: [],
  enableGradient: false,
  fillMode: "solid",
  fillColor,
  fillColorSecondary: "#000000",
  fillGradientType: "linear",
  fillStops: [],
  fillKeyframes: [],
  rotationOffset: { x: 0, y: 0, z: 0 },
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

const failingStore = (
  source: EditorProjectStore,
  {
    failOnWrite,
    failOnRemove,
  }: { failOnWrite?: number; failOnRemove?: number } = {}
) => {
  const store = cloneStorage(source)
  let writes = 0
  let removes = 0
  const setItem = store.setItem.bind(store)
  const removeItem = store.removeItem.bind(store)
  store.setItem = (key, value) => {
    writes += 1
    if (failOnWrite !== undefined && writes === failOnWrite) {
      throw new Error(`storage write ${failOnWrite} failed`)
    }
    setItem(key, value)
  }
  store.removeItem = (key) => {
    removes += 1
    if (failOnRemove !== undefined && removes === failOnRemove) {
      throw new Error(`storage remove ${failOnRemove} failed`)
    }
    removeItem(key)
  }
  return store
}

const seedTwoProjects = (store: EditorProjectStore) => {
  const replacementSnapshot = validSnapshot("#00aa88")
  const replacement = createProjectMetadata("Replacement")
  const currentSnapshot = validSnapshot("#ff4400")
  const current = createProjectMetadata("Current project")
  writePersistedEditorDocument(replacementSnapshot, replacement, store)
  writePersistedEditorDocument(currentSnapshot, current, store)
  return {
    current: { snapshot: currentSnapshot, project: current },
    replacement: { snapshot: replacementSnapshot, project: replacement },
  }
}

describe("persistCurrentProjectDeletion", () => {
  it("does not resurrect a deleted identity after a failed replacement write", () => {
    const baseline = createMemoryStorage()
    const seeded = seedTwoProjects(baseline)
    const store = failingStore(baseline, { failOnWrite: 1 })

    expect(() =>
      persistCurrentProjectDeletion({
        deleting: seeded.current.project,
        replacement: seeded.replacement,
        store,
      })
    ).toThrow("storage write 1 failed")

    expect(readCurrentEditorProjectId(store)).toBe(seeded.current.project.id)
    expect(
      readPersistedEditorProject(seeded.current.project.id, store)?.snapshot
    ).toEqual(seeded.current.snapshot)

    const flushed = flushAutosaveIfAllowed(
      seeded.current.snapshot,
      seeded.current.project,
      [],
      store
    )
    expect(flushed.wrote).toBe(true)
    expect(readCurrentEditorProjectId(store)).toBe(seeded.current.project.id)
  })

  it("blocks autosave of the deleted identity when index or removal fails after the switch", () => {
    const baseline = createMemoryStorage()
    const seeded = seedTwoProjects(baseline)

    const indexFailStore = failingStore(baseline, { failOnWrite: 3 })
    const afterIndexFailure = persistCurrentProjectDeletion({
      deleting: seeded.current.project,
      replacement: seeded.replacement,
      store: indexFailStore,
    })
    expect(afterIndexFailure.project.id).toBe(seeded.replacement.project.id)
    expect(afterIndexFailure.blockedAutosaveIds).toContain(
      seeded.current.project.id
    )
    expect(
      flushAutosaveIfAllowed(
        seeded.current.snapshot,
        seeded.current.project,
        afterIndexFailure.blockedAutosaveIds,
        indexFailStore
      ).wrote
    ).toBe(false)
    expect(readCurrentEditorProjectId(indexFailStore)).toBe(
      seeded.replacement.project.id
    )
    expect(
      readRestoredEditorDocument(indexFailStore).document?.project.id
    ).toBe(seeded.replacement.project.id)

    const removeFailStore = failingStore(baseline, { failOnRemove: 1 })
    const afterRemoveFailure = persistCurrentProjectDeletion({
      deleting: seeded.current.project,
      replacement: seeded.replacement,
      store: removeFailStore,
    })
    expect(
      flushAutosaveIfAllowed(
        seeded.current.snapshot,
        seeded.current.project,
        afterRemoveFailure.blockedAutosaveIds,
        removeFailStore
      ).wrote
    ).toBe(false)
    expect(readCurrentEditorProjectId(removeFailStore)).toBe(
      seeded.replacement.project.id
    )
  })

  it("reloads the replacement after a successful delete, not the deleted project", () => {
    const store = createMemoryStorage()
    const seeded = seedTwoProjects(store)

    const deleted = persistCurrentProjectDeletion({
      deleting: seeded.current.project,
      replacement: seeded.replacement,
      store,
    })

    expect(deleted.project.id).toBe(seeded.replacement.project.id)
    expect(
      readPersistedEditorProject(seeded.current.project.id, store)
    ).toBeNull()
    expect(
      store.getItem(editorProjectStorageKey(seeded.current.project.id))
    ).toBe(null)
    expect(
      listPersistedEditorProjects(store).map((project) => project.id)
    ).not.toContain(seeded.current.project.id)

    const restored = readRestoredEditorDocument(store)
    expect(restored.document?.project.id).toBe(seeded.replacement.project.id)
    expect(restored.document?.snapshot).toEqual(seeded.replacement.snapshot)
    expect(
      createBlankEditorSnapshot(seeded.current.snapshot).fillColor
    ).not.toBe(seeded.replacement.snapshot.fillColor)
  })
})
