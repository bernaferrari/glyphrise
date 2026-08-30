import { afterEach, describe, expect, it, vi } from "vitest"
import type { EditorSnapshot } from "./EditorModel"
import {
  createEditorDocumentFile,
  createProjectMetadata,
  deletePersistedEditorProject,
  isPersistedEditorSnapshot,
  listPersistedEditorProjects,
  normalizeProjectName,
  parseEditorDocument,
  parseEditorDocumentSnapshot,
  parseImportedEditorDocument,
  readPersistedEditorDocument,
  readPersistedEditorProject,
  writePersistedEditorDocument,
} from "./EditorDocumentModel"
import { createBlankEditorSnapshot } from "./EditorProjectModel"

const validSnapshot = (): EditorSnapshot => ({
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
  fillColor: "#ffffff",
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

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("EditorDocumentModel", () => {
  it("rejects project files from unsupported schema versions", () => {
    const snapshot = validSnapshot()

    expect(isPersistedEditorSnapshot(snapshot)).toBe(true)
    expect(parseEditorDocumentSnapshot({ version: 1, snapshot })).toBeNull()
  })

  it("preserves named version-two project metadata", () => {
    const project = createProjectMetadata(
      "Launch icon",
      "2026-08-09T12:00:00.000Z"
    )
    const documentFile = createEditorDocumentFile(validSnapshot(), project)
    const parsed = parseEditorDocument(documentFile)

    expect(parsed?.project.id).toBe(project.id)
    expect(parsed?.project.name).toBe("Launch icon")
    expect(parsed?.snapshot.shapes[0].iconName).toBe("Heart")
  })

  it("parses imported documents as a fresh local copy", () => {
    vi.stubGlobal("window", { localStorage: createMemoryStorage() })
    const sourceProject = createProjectMetadata(
      "Launch icon",
      "2026-08-09T12:00:00.000Z"
    )
    const documentFile = createEditorDocumentFile(
      validSnapshot(),
      sourceProject
    )
    const imported = parseImportedEditorDocument(documentFile)

    expect(imported?.project.id).not.toBe(sourceProject.id)
    expect(imported?.project.name).toBe("Launch icon (imported copy)")
    expect(imported?.snapshot).toEqual(
      parseEditorDocument(documentFile)?.snapshot
    )

    writePersistedEditorDocument(validSnapshot(), sourceProject)
    writePersistedEditorDocument(imported!.snapshot, imported!.project)
    expect(readPersistedEditorProject(sourceProject.id)?.project.id).toBe(
      sourceProject.id
    )
    expect(listPersistedEditorProjects()).toHaveLength(2)
  })

  it("keeps recent projects isolated and restores the active project", () => {
    vi.stubGlobal("window", { localStorage: createMemoryStorage() })
    const first = createProjectMetadata("First project")
    const second = createProjectMetadata("Second project")
    const firstSnapshot = validSnapshot()
    const secondSnapshot = validSnapshot()
    secondSnapshot.fillColor = "#ff0066"

    writePersistedEditorDocument(firstSnapshot, first)
    writePersistedEditorDocument(secondSnapshot, second)

    expect(readPersistedEditorProject(first.id)?.snapshot.fillColor).toBe(
      "#ffffff"
    )
    expect(readPersistedEditorProject(second.id)?.snapshot.fillColor).toBe(
      "#ff0066"
    )
    expect(readPersistedEditorDocument()?.project.id).toBe(second.id)
    expect(
      listPersistedEditorProjects().map((project) => project.name)
    ).toEqual(["Second project", "First project"])

    deletePersistedEditorProject(second.id)
    expect(readPersistedEditorProject(second.id)).toBeNull()
    expect(readPersistedEditorDocument()).toBeNull()
    expect(
      listPersistedEditorProjects().map((project) => project.name)
    ).toEqual(["First project"])
  })

  it("keeps every saved project discoverable beyond eight entries", () => {
    vi.stubGlobal("window", { localStorage: createMemoryStorage() })
    const projects = Array.from({ length: 12 }, (_, index) =>
      createProjectMetadata(`Project ${index + 1}`)
    )

    projects.forEach((project) =>
      writePersistedEditorDocument(validSnapshot(), project)
    )

    const recentProjects = listPersistedEditorProjects()
    expect(recentProjects).toHaveLength(12)
    expect(recentProjects.map((project) => project.name)).toEqual(
      projects.map((project) => project.name).reverse()
    )
    projects.forEach((project) =>
      expect(readPersistedEditorProject(project.id)?.project.id).toBe(
        project.id
      )
    )
  })

  it("creates a genuinely blank project from the example snapshot", () => {
    const base = validSnapshot()
    base.shapes.push({ ...base.shapes[0], id: "clip-2", time: 4 })
    base.tracks = [
      {
        id: "scale",
        name: "Scale",
        color: "#fff",
        min: 0,
        max: 2,
        defaultValue: 1,
        keyframes: [
          { id: "scale-1", time: 1, value: 1.5, easing: "ease-in-out" },
        ],
      },
    ]

    const blank = createBlankEditorSnapshot(base)
    expect(blank.shapes).toHaveLength(1)
    expect(blank.shapes[0].time).toBe(0)
    expect(blank.shapes[0].transitionType).toBe("cut")
    expect(blank.tracks[0].keyframes).toEqual([])
  })

  it("normalizes empty and overly long project names", () => {
    expect(normalizeProjectName("   ")).toBe("Untitled project")
    expect(normalizeProjectName(`  My   icon  `)).toBe("My icon")
    expect(normalizeProjectName("a".repeat(100))).toHaveLength(80)
  })

  it("requires every clip to use the current transition schema", () => {
    const snapshot = validSnapshot()
    delete (snapshot.shapes[0] as Partial<(typeof snapshot.shapes)[number]>)
      .transitionType

    const project = createProjectMetadata("Current schema")
    expect(
      parseEditorDocumentSnapshot({
        ...createEditorDocumentFile(validSnapshot(), project),
        snapshot,
      })
    ).toBeNull()
  })

  it("rejects unsupported file versions and incomplete snapshots", () => {
    expect(
      parseEditorDocumentSnapshot({ version: 3, snapshot: validSnapshot() })
    ).toBeNull()
    expect(
      parseEditorDocumentSnapshot({ ...validSnapshot(), materialSettings: {} })
    ).toBeNull()
  })

  it("rejects unsafe SVG content nested in a project", () => {
    const snapshot = validSnapshot()
    snapshot.shapes[0].svgContent = `<svg onload="alert(1)"><path d="M0 0h1v1z"/></svg>`
    const documentFile = createEditorDocumentFile(
      validSnapshot(),
      createProjectMetadata()
    )

    expect(
      parseEditorDocumentSnapshot({ ...documentFile, snapshot })
    ).toBeNull()
  })

  it("rejects non-finite values and oversized collections", () => {
    const documentFile = createEditorDocumentFile(
      validSnapshot(),
      createProjectMetadata()
    )
    expect(
      parseEditorDocumentSnapshot({
        ...documentFile,
        snapshot: { ...validSnapshot(), duration: Infinity },
      })
    ).toBeNull()
    expect(
      parseEditorDocumentSnapshot({
        ...documentFile,
        snapshot: {
          ...validSnapshot(),
          tracks: Array.from({ length: 33 }, (_, index) => ({
            id: `track-${index}`,
            name: "Track",
            color: "#fff",
            min: 0,
            max: 1,
            defaultValue: 0,
            keyframes: [],
          })),
        },
      })
    ).toBeNull()
  })
})
