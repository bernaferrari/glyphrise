import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"
import type { ExportSceneSnapshot } from "./ExportSceneSnapshot"
import { generateR3fCode } from "./ExportR3fTemplate"

const scene: ExportSceneSnapshot = {
  duration: 5,
  materialPreset: "chrome",
  colorA: "#ffffff",
  colorB: "#000000",
  fillKeyframes: [],
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
  roughness: 0.2,
  metalness: 0.5,
  reflectance: 0.8,
  clearcoat: 0.4,
  clearcoatRoughness: 0.1,
  transmission: 0,
  thickness: 0.4,
  emissiveIntensity: 0,
  extrusionDepth: 10,
  bevelEnabled: true,
  bevelThickness: 0.12,
  bevelSize: 0.06,
  bevelSegments: 4,
  layerSpacing: 0.16,
  ambientIntensity: 0.5,
  keyLightIntensity: 1,
  rimLightIntensity: 0.4,
  svgPathA: `<svg><path d="M0 0h1v1z"/></svg>`,
  svgPathB: `<svg><path d="M0 0h2v2z"/></svg>`,
  shapes: [],
  tracks: [],
  rotationOffset: { x: 0, y: 0, z: 0 },
  rotationAxisKeyframes: [],
  objectScale: 1,
  objectScaleAxes: { x: 1, y: 1, z: 1 },
  moveOffset: { x: 0, y: 0, z: 0 },
  moveKeyframes: [],
  keyLightPosition: { x: 5, y: 5, z: 4 },
  keyLightPositionKeyframes: [],
}

const babelParser = createRequire(import.meta.url)(
  "next/dist/compiled/babel/parser"
) as {
  parse: (
    code: string,
    options: { sourceType: string; plugins: string[] }
  ) => unknown
}

describe("ExportR3fTemplate", () => {
  it("generates a state-free animation loop with disposable Three resources", () => {
    const code = generateR3fCode(scene)

    expect(code).toContain("useFrame(({ clock }) =>")
    expect(code).toContain("root.position.set(")
    expect(code).toContain("materialA.dispose()")
    expect(code).toContain("geometry.dispose()")
    expect(code).not.toContain("useState")
    expect(code).not.toContain("setMotion")
    expect(code).not.toContain("[motion]")
  })

  it("emits syntactically valid TSX", () => {
    expect(() =>
      babelParser.parse(generateR3fCode(scene), {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      })
    ).not.toThrow()
  })

  it("carries authored wipes, path overrides, and animated light position into the starter", () => {
    const code = generateR3fCode({
      ...scene,
      shapes: [
        {
          id: "shape-a",
          time: 0,
          iconId: "heart",
          iconName: "Heart",
          svgContent: scene.svgPathA,
          color: "#ff0000",
          colorSecondary: "#00ff00",
          fillStops: [
            { id: "stop-1", color: "#ff0000", position: 0 },
            { id: "stop-2", color: "#00ff00", position: 1 },
          ],
          pathOverrides: [
            {
              id: "0:0",
              visible: true,
              color: "#123456",
              depthMultiplier: 1.5,
              scale: { x: 0.9, y: 1.1, z: 1 },
            },
          ],
          easing: "ease-in-out",
          transitionType: "wipe",
          wipeDirection: { x: 0.707, y: -0.707 },
        },
      ],
      keyLightPositionKeyframes: [
        {
          id: "light-1",
          time: 1,
          value: { x: 2, y: 3, z: 4 },
          easing: "ease-in-out",
        },
      ],
    })

    expect(code).toContain('"transitionType": "wipe"')
    expect(code).toContain('"pathOverrides"')
    expect(code).toContain("materialA.clippingPlanes = [clipPlaneA]")
    expect(code).toContain("ANIMATION.keyLightPositionKeyframes")
  })
})
