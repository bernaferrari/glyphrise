import { describe, expect, it } from "vitest"
import type { EditorSnapshot } from "./EditorModel"
import {
  isPersistedEditorSnapshot,
  parseEditorDocumentSnapshot,
} from "./EditorDocumentModel"

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

describe("EditorDocumentModel", () => {
  it("accepts and normalizes a complete version-one project", () => {
    const snapshot = validSnapshot()

    expect(isPersistedEditorSnapshot(snapshot)).toBe(true)
    expect(
      parseEditorDocumentSnapshot({ version: 1, snapshot })?.shapes[0]
        .transitionType
    ).toBe("fade")
  })

  it("normalizes legacy clips that omitted a transition type", () => {
    const snapshot = validSnapshot()
    delete (snapshot.shapes[0] as Partial<(typeof snapshot.shapes)[number]>)
      .transitionType

    expect(
      parseEditorDocumentSnapshot(snapshot)?.shapes[0].transitionType
    ).toBe("fade")
  })

  it("rejects unsupported file versions and incomplete snapshots", () => {
    expect(
      parseEditorDocumentSnapshot({ version: 2, snapshot: validSnapshot() })
    ).toBeNull()
    expect(
      parseEditorDocumentSnapshot({ ...validSnapshot(), materialSettings: {} })
    ).toBeNull()
  })

  it("rejects unsafe SVG content nested in a project", () => {
    const snapshot = validSnapshot()
    snapshot.shapes[0].svgContent = `<svg onload="alert(1)"><path d="M0 0h1v1z"/></svg>`

    expect(parseEditorDocumentSnapshot(snapshot)).toBeNull()
  })

  it("rejects non-finite values and oversized collections", () => {
    expect(
      parseEditorDocumentSnapshot({ ...validSnapshot(), duration: Infinity })
    ).toBeNull()
    expect(
      parseEditorDocumentSnapshot({
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
      })
    ).toBeNull()
  })
})
