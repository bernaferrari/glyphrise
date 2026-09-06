import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { EditorSnapshot } from "./EditorModel"
import {
  createEditorDocumentFile,
  createProjectMetadata,
  editorProjectStorageKey,
  parseImportedEditorDocument,
  readCurrentEditorProjectId,
  readPersistedEditorProject,
  writePersistedEditorDocument,
  type EditorProjectStore,
} from "./EditorDocumentModel"
import {
  persistProjectActivation,
  type ProjectActivationKind,
} from "./EditorProjectActivation"

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

const seedPreviousProject = (store: EditorProjectStore) => {
  const snapshot = validSnapshot("#111111")
  const project = createProjectMetadata("Previous project")
  writePersistedEditorDocument(snapshot, project, store)
  return {
    snapshot,
    project,
    raw: store.getItem(editorProjectStorageKey(project.id)),
  }
}

describe("persistProjectActivation", () => {
  const kinds: ProjectActivationKind[] = [
    "create",
    "switch",
    "duplicate",
    "import",
  ]

  it("persists the incoming project before the hook restores identity", () => {
    const source = readFileSync(
      new URL("./useEditorSnapshotHistory.ts", import.meta.url),
      "utf8"
    )
    const persistAt = source.indexOf("persistProjectActivation({")
    const restoreAt = source.indexOf("restoreSnapshot(persisted.snapshot)")
    expect(persistAt).toBeGreaterThan(-1)
    expect(restoreAt).toBeGreaterThan(persistAt)
  })

  it.each(kinds)(
    "keeps the previous project intact when any write fails during %s",
    (kind) => {
      const baseline = createMemoryStorage()
      const previous = seedPreviousProject(baseline)
      const incomingSnapshot = validSnapshot("#ff0066")
      const switchTarget = createProjectMetadata("Switch target")
      if (kind === "switch") {
        writePersistedEditorDocument(incomingSnapshot, switchTarget, baseline)
        writePersistedEditorDocument(
          previous.snapshot,
          previous.project,
          baseline
        )
      }
      previous.raw = baseline.getItem(
        editorProjectStorageKey(previous.project.id)
      )

      const incomingProject =
        kind === "switch"
          ? switchTarget
          : kind === "import"
            ? parseImportedEditorDocument(
                createEditorDocumentFile(
                  incomingSnapshot,
                  createProjectMetadata("Imported source")
                )
              )!.project
            : createProjectMetadata(
                kind === "duplicate"
                  ? "Previous project copy"
                  : "Created project"
              )

      const requestFor = (store: EditorProjectStore) => ({
        kind,
        incomingSnapshot,
        incomingProject:
          kind === "import"
            ? parseImportedEditorDocument(
                createEditorDocumentFile(
                  incomingSnapshot,
                  createProjectMetadata("Imported source")
                )
              )!.project
            : incomingProject,
        outgoing: {
          snapshot: previous.snapshot,
          project: previous.project,
        },
        store,
      })

      for (let failOnWrite = 1; failOnWrite <= 4; failOnWrite += 1) {
        const store = failingStore(baseline, failOnWrite)
        expect(() => persistProjectActivation(requestFor(store))).toThrow(
          `storage write ${failOnWrite} failed`
        )

        expect(readCurrentEditorProjectId(store)).toBe(previous.project.id)
        const storedPrevious = readPersistedEditorProject(
          previous.project.id,
          store
        )
        expect(storedPrevious?.project.id).toBe(previous.project.id)
        expect(storedPrevious?.snapshot.fillColor).toBe(
          previous.snapshot.fillColor
        )
        expect(storedPrevious?.snapshot).toEqual(previous.snapshot)
        if (failOnWrite === 1) {
          expect(
            store.getItem(editorProjectStorageKey(previous.project.id))
          ).toBe(previous.raw)
        }

        const retryStore = cloneStorage(store)
        const retried = persistProjectActivation(requestFor(retryStore))
        expect(retried.kind).toBe(kind)
        expect(retried.project.id).not.toBe(previous.project.id)
        expect(readCurrentEditorProjectId(retryStore)).toBe(retried.project.id)
        expect(
          readPersistedEditorProject(previous.project.id, retryStore)?.snapshot
        ).toEqual(previous.snapshot)
        expect(
          readPersistedEditorProject(retried.project.id, retryStore)?.snapshot
            .fillColor
        ).toBe("#ff0066")
      }
    }
  )

  it("makes identity, document, and storage agree after a successful switch", () => {
    const store = createMemoryStorage()
    const previous = seedPreviousProject(store)
    const incomingSnapshot = validSnapshot("#00aa88")
    const incomingProject = createProjectMetadata("Opened project")
    writePersistedEditorDocument(incomingSnapshot, incomingProject, store)
    writePersistedEditorDocument(previous.snapshot, previous.project, store)

    const activated = persistProjectActivation({
      kind: "switch",
      incomingSnapshot,
      incomingProject,
      outgoing: previous,
      store,
    })

    expect(readCurrentEditorProjectId(store)).toBe(activated.project.id)
    expect(activated.project.id).toBe(incomingProject.id)
    expect(
      readPersistedEditorProject(activated.project.id, store)?.snapshot
    ).toEqual(incomingSnapshot)
    expect(
      readPersistedEditorProject(previous.project.id, store)?.snapshot
    ).toEqual(previous.snapshot)
  })
})
