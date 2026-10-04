import * as THREE from "three"
import { describe, expect, it } from "vitest"
import { applySvgTransitionState } from "./SvgTransitionState"

const setup = () => {
  const materialA = new THREE.MeshStandardMaterial()
  const materialB = new THREE.MeshStandardMaterial()
  const iconA = new THREE.Group().add(
    new THREE.Mesh(new THREE.BoxGeometry(), materialA)
  )
  const iconB = new THREE.Group().add(
    new THREE.Mesh(new THREE.BoxGeometry(), materialB)
  )
  const pivot = new THREE.Group().add(iconA, iconB)
  const options = {
    transitionType: "wipe" as const,
    wipeDirection: { x: 1, y: 1 },
    iconA,
    iconB,
    pivot,
    clipPlaneA: new THREE.Plane(),
    clipPlaneB: new THREE.Plane(),
  }
  return { options, materialA, materialB }
}

describe("wipe shader stability", () => {
  it("keeps the same shader variant before, during, and after the first slash", () => {
    const { options, materialA, materialB } = setup()
    applySvgTransitionState({ ...options, progress: 0 })
    const versions = [materialA.version, materialB.version]
    for (const progress of [0.1, 0.5, 0.9, 1, 0]) {
      applySvgTransitionState({ ...options, progress })
      expect([materialA.version, materialB.version]).toEqual(versions)
      expect(materialA.clippingPlanes).toEqual([options.clipPlaneA])
      expect(materialB.clippingPlanes).toEqual([options.clipPlaneB])
    }
    expect(options.iconA.visible).toBe(true)
    expect(options.iconB.visible).toBe(false)
    expect(
      options.clipPlaneA.distanceToPoint(new THREE.Vector3(100, 100, 100))
    ).toBeGreaterThan(0)
  })

  it("still removes clipping when changing from a wipe to a fade", () => {
    const { options, materialA, materialB } = setup()
    applySvgTransitionState({ ...options, progress: 0.5 })
    const result = applySvgTransitionState({
      ...options,
      transitionType: "fade",
      progress: 0.25,
    })
    expect(result.isCrossfade).toBe(true)
    expect(materialA.clippingPlanes).toBeNull()
    expect(materialB.clippingPlanes).toBeNull()
    expect(materialA.opacity).toBe(0.75)
    expect(materialB.opacity).toBe(0.25)
  })
})
