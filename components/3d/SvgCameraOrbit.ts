import * as THREE from "three"
import type { Vector3Value } from "./SvgTypes"

export const applySvgCameraOrbit = (
  camera: THREE.PerspectiveCamera,
  orbit: Vector3Value,
  distance: number
) => {
  // Carry the camera's up direction through the poles instead of lookAt's
  // fixed world-up, which flips the view or requires a pitch limit.
  camera.rotation.set(
    -THREE.MathUtils.degToRad(orbit.x),
    -THREE.MathUtils.degToRad(orbit.y),
    -THREE.MathUtils.degToRad(orbit.z),
    "YXZ"
  )
  camera.position.set(0, 0, distance).applyQuaternion(camera.quaternion)
  camera.updateMatrixWorld()
}
