import * as THREE from "three"
import { describe, expect, it, vi } from "vitest"
import { fallbackGoogleMeshStops } from "./SvgColor"
import { updateGroupFillColors } from "./SvgMaterialState"
import { prepareFilamentExportObject } from "./SvgExport"
import { disposeObjectTree } from "./SvgSceneUtils"
import { iconGradientTexture } from "./SvgGradientTexture"
import {
  FINISH_SPECS,
  gradeFinishSurfaceColor,
  type MaterialPresetId,
} from "./MaterialPresets"
import * as SvgColor from "./SvgColor"

const meshGradientColor = (u: number, v: number) =>
  SvgColor.createIconGradientSampler("mesh", fallbackGoogleMeshStops)(
    u,
    v
  ).clone()

const makeIcon = () => {
  const geometry = new THREE.PlaneGeometry(24, 24).translate(12, 12, 0)
  const material = new THREE.MeshStandardMaterial()
  const group = new THREE.Group().add(new THREE.Mesh(geometry, material))
  const fill = {
    color: "#FF9900",
    colorStops: fallbackGoogleMeshStops,
    enableGradient: true,
    gradientType: "mesh" as const,
    materialPreset: "satin" as const,
    emissiveIntensity: 0,
  }
  updateGroupFillColors(group, fill)
  return { group, material, geometry, fill }
}

// Simulates the GPU's linear filtering of an sRGB color map.
const sample = (texture: THREE.DataTexture, u: number, v: number) => {
  const { width, height } = texture.image
  const data = texture.image.data!
  const x = u * width - 0.5,
    y = v * height - 0.5
  const pixel = (px: number, py: number) => {
    const offset =
      (Math.max(0, Math.min(height - 1, py)) * width +
        Math.max(0, Math.min(width - 1, px))) *
      4
    return new THREE.Color().setRGB(
      data[offset] / 255,
      data[offset + 1] / 255,
      data[offset + 2] / 255,
      THREE.SRGBColorSpace
    )
  }
  const x0 = Math.floor(x),
    y0 = Math.floor(y)
  return pixel(x0, y0)
    .lerp(pixel(x0 + 1, y0), x - x0)
    .lerp(pixel(x0, y0 + 1).lerp(pixel(x0 + 1, y0 + 1), x - x0), y - y0)
}

describe("portable icon gradient", () => {
  it.each(
    (Object.keys(FINISH_SPECS) as MaterialPresetId[]).flatMap((preset) =>
      ["#ff5c8f", "#38bdf8"].map((color) => ({ preset, color }))
    )
  )(
    "preserves the graded channels of a saturated $preset mesh fill ($color)",
    ({ preset, color }) => {
      const stops = Array.from({ length: 9 }, (_, index) => ({
        color,
        position: index / 8,
      }))
      const texture = iconGradientTexture(
        new THREE.Group(),
        "mesh",
        stops,
        preset
      )
      const source = SvgColor.createIconGradientSampler("mesh", stops)(0.5, 0.5)
      const expected = gradeFinishSurfaceColor(preset, source)
      const actual = sample(texture, 0.5, 0.5)
      for (const channel of ["r", "g", "b"] as const) {
        expect(actual[channel]).toBeCloseTo(
          THREE.MathUtils.clamp(expected[channel], 0, 1),
          2
        )
      }
      texture.dispose()
    }
  )
  it("reuses baked colors across rebuilt icons without sharing disposable textures", () => {
    const sampler = vi.spyOn(SvgColor, "createIconGradientSampler")
    const stops = [
      { color: "#1287a4", position: 0 },
      { color: "#e96382", position: 1 },
    ]
    try {
      const first = iconGradientTexture(new THREE.Group(), "mesh", stops)
      const second = iconGradientTexture(new THREE.Group(), "mesh", stops)
      expect(sampler).toHaveBeenCalledTimes(1)
      // Compare identity directly so the matcher doesn't deeply inspect
      // two equal, full-sized texture buffers to explain a negated match.
      expect(second === first).toBe(false)
      expect(second.image.data === first.image.data).toBe(false)
      expect(
        second.image.data!.every(
          (value, index) => value === first.image.data![index]
        )
      ).toBe(true)
      const dispose = vi.spyOn(second, "dispose")
      first.dispose()
      expect(dispose).not.toHaveBeenCalled()
      second.dispose()
    } finally {
      sampler.mockRestore()
    }
  })
  it("uses one texel for a uniform fill, and safely resizes when colors diverge", () => {
    const group = new THREE.Group()
    const solid = [
      { color: "#426df4", position: 0 },
      { color: "#426df4", position: 1 },
    ]
    const texture = iconGradientTexture(group, "linear", solid)
    expect(texture.image.width).toBe(1)
    expect(texture.image.height).toBe(1)
    expect(sample(texture, 0, 0).getHexString()).toBe("426df4")
    const dispose = vi.spyOn(texture, "dispose")
    const gradient = iconGradientTexture(group, "linear", [
      solid[0],
      { color: "#ffffff", position: 1 },
    ])
    expect(gradient).not.toBe(texture)
    expect(dispose).toHaveBeenCalledOnce()
    expect(gradient.image.width).toBe(256)
    expect(iconGradientTexture(group, "linear", solid).image.width).toBe(1)
  })
  it.each(["linear", "radial", "conic"] as const)(
    "preserves %s gradient orientation and middle stops",
    (type) => {
      const stops = [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 0.5 },
        { color: "#000000", position: 1 },
      ]
      const map = iconGradientTexture(new THREE.Group(), type, stops)
      const point =
        type === "radial"
          ? [0.5 + Math.SQRT1_2 / 2, 0.5]
          : type === "conic"
            ? [0.8, 0.5]
            : [0.5, 0.5]
      expect(sample(map, point[0], point[1]).r).toBeGreaterThan(0.97)
      const darkPoint =
        type === "radial" ? [0.5, 0.5] : type === "conic" ? [0.2, 0.5] : [0, 1]
      expect(sample(map, darkPoint[0], darkPoint[1]).r).toBeLessThan(0.02)
      map.dispose()
    }
  )

  it("bakes finish coloring and replaces the texture when switching back from solid fill", () => {
    const { group, material, fill } = makeIcon()
    const original = material.map!
    const dispose = vi.spyOn(original, "dispose")
    updateGroupFillColors(group, { ...fill, enableGradient: false })
    expect(material.map).toBeNull()
    expect(dispose).toHaveBeenCalledOnce()
    updateGroupFillColors(group, { ...fill, materialPreset: "pearl" })
    expect(material.map).not.toBe(original)
    const actual = sample(material.map as THREE.DataTexture, 0.42, 0.58)
    const expected = gradeFinishSurfaceColor(
      "pearl",
      meshGradientColor(0.42, 0.58)
    )
    expect(actual.r).toBeCloseTo(expected.r, 2)
    expect(actual.g).toBeCloseTo(expected.g, 2)
    expect(actual.b).toBeCloseTo(expected.b, 2)
    disposeObjectTree(group)
  })
  it("samples smooth color inside large triangles, independent of their vertices", () => {
    const { material, geometry } = makeIcon()
    expect(material.map).not.toBeNull()
    expect(material.vertexColors).toBe(false)
    const actual = sample(material.map as THREE.DataTexture, 0.42, 0.58)
    const expected = meshGradientColor(0.42, 0.58)
    expect(
      Math.max(
        Math.abs(actual.r - expected.r),
        Math.abs(actual.g - expected.g),
        Math.abs(actual.b - expected.b)
      )
    ).toBeLessThan(0.01)
    const position = geometry.getAttribute("position"),
      uv = geometry.getAttribute("uv")
    for (let i = 0; i < position.count; i++) {
      expect(uv.getX(i)).toBeCloseTo(position.getX(i) / 24)
      expect(uv.getY(i)).toBeCloseTo(position.getY(i) / 24)
    }
  })

  it("reuses an unchanged texture, updates edited colors, and cleans up owned textures", () => {
    const { group, material, fill } = makeIcon()
    expect(material.map).not.toBeNull()
    const texture = material.map!
    const version = texture.version
    updateGroupFillColors(group, fill)
    expect(material.map).toBe(texture)
    expect(texture.version).toBe(version)
    updateGroupFillColors(group, {
      ...fill,
      colorStops: [
        { color: "#ff0000", position: 0 },
        { color: "#0000ff", position: 1 },
      ],
    })
    expect(material.map).toBe(texture)
    expect(texture.version).toBeGreaterThan(version)
    const dispose = vi.spyOn(texture, "dispose")
    disposeObjectTree(group)
    expect(dispose).toHaveBeenCalledOnce()
  })

  it("exports standard UVs and a color map without disposing the live preview texture", () => {
    const { group, material } = makeIcon()
    material.userData.surfaceEmissiveUniform = { value: 0.4 }
    expect(material.map).not.toBeNull()
    const exported = prepareFilamentExportObject(
      new THREE.Group(),
      {
        materialPreset: "satin",
        enableGradient: true,
        gradientType: "mesh",
        rotationOffset: { x: 0, y: 0, z: 0 },
        objectScale: 1,
        moveOffset: { x: 0, y: 0, z: 0 },
        transitionProgress: 0,
      },
      [group],
      () => {}
    )
    let exportedMesh: THREE.Mesh | undefined
    exported.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) exportedMesh = object as THREE.Mesh
    })
    const exportMaterial = exportedMesh!.material as THREE.MeshStandardMaterial
    expect(exportMaterial.map?.image).toBe(material.map!.image)
    expect(exportMaterial.vertexColors).toBe(false)
    expect(exportMaterial.emissiveMap).toBe(exportMaterial.map)
    expect(exportMaterial.emissiveIntensity).toBe(0.4)
    expect(exportedMesh!.geometry.getAttribute("uv")).toBeDefined()
    const dispose = vi.spyOn(material.map!, "dispose")
    disposeObjectTree(exported)
    expect(dispose).not.toHaveBeenCalled()
  })
})
