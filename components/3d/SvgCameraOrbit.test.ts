import * as THREE from "three"
import { describe, expect, it } from "vitest"
import { applySvgCameraOrbit } from "./SvgCameraOrbit"

describe("free camera orbit", () => {
  it.each([90, 135, 180, 270, 360, -90, -135, -180, -270, -360])(
    "keeps looking at the artwork through a %s degree tilt",
    (x) => {
      const camera = new THREE.PerspectiveCamera()
      applySvgCameraOrbit(camera, { x, y: 25, z: 0 }, 10)
      const expected = new THREE.Vector3(
        -Math.sin(THREE.MathUtils.degToRad(25)) *
          Math.cos(THREE.MathUtils.degToRad(x)),
        Math.sin(THREE.MathUtils.degToRad(x)),
        Math.cos(THREE.MathUtils.degToRad(25)) *
          Math.cos(THREE.MathUtils.degToRad(x))
      ).multiplyScalar(10)
      expect(camera.position.distanceTo(expected)).toBeLessThan(1e-10)
      expect(
        camera
          .getWorldDirection(new THREE.Vector3())
          .dot(camera.position.clone().normalize())
      ).toBeCloseTo(-1, 10)
    }
  )
  it("crosses the pole continuously without an up-vector flip", () => {
    const camera = new THREE.PerspectiveCamera()
    applySvgCameraOrbit(camera, { x: 89, y: 0, z: 0 }, 10)
    const before = camera.quaternion.clone()
    applySvgCameraOrbit(camera, { x: 91, y: 0, z: 0 }, 10)
    expect(
      THREE.MathUtils.radToDeg(before.angleTo(camera.quaternion))
    ).toBeCloseTo(2, 8)
  })
})
