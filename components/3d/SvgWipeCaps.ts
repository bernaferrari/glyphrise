import * as THREE from "three"
import { ICON_VIEWBOX_SIZE } from "./SvgSceneUtils"

type WipeCap = { source: THREE.Mesh; surface: THREE.Mesh }
const capsByGroup = new WeakMap<THREE.Group, WipeCap[]>()
const planeNormal = new THREE.Vector3(0, 0, 1)

function stencilMaterial(
  plane: THREE.Plane,
  side: THREE.Side,
  operation: THREE.StencilOp
) {
  return new THREE.MeshBasicMaterial({
    side,
    clippingPlanes: [plane],
    depthTest: false,
    depthWrite: false,
    colorWrite: false,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: operation,
    stencilZFail: operation,
    stencilZPass: operation,
  })
}

/** Close the moving cut using the solid's front/back stencil winding, including holes. */
export function attachSvgWipeCaps(group: THREE.Group, plane: THREE.Plane) {
  const caps: WipeCap[] = []
  const sources: THREE.Mesh[] = []
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) sources.push(object)
  })
  for (const source of sources) {
    const sourceMaterial = Array.isArray(source.material)
      ? source.material[0]
      : source.material
    const material = sourceMaterial.clone()
    material.onBeforeCompile = sourceMaterial.onBeforeCompile
    material.customProgramCacheKey = sourceMaterial.customProgramCacheKey
    material.clippingPlanes = null
    material.clipShadows = false
    material.side = THREE.DoubleSide
    material.stencilWrite = true
    material.stencilRef = 0
    material.stencilFunc = THREE.NotEqualStencilFunc
    material.stencilFail = THREE.KeepStencilOp
    material.stencilZFail = THREE.KeepStencilOp
    material.stencilZPass = THREE.KeepStencilOp
    material.polygonOffset = false

    source.geometry.computeBoundingSphere()
    const size = Math.max(
      1,
      (source.geometry.boundingSphere?.radius ?? ICON_VIEWBOX_SIZE) * 2.1
    )
    const geometry = new THREE.PlaneGeometry(size, size)
    geometry.userData.iconGradientUvs = true
    const surface = new THREE.Mesh(geometry, material)
    surface.userData.wipeCap = true
    surface.visible = false
    surface.frustumCulled = false
    surface.renderOrder = 1000 + source.renderOrder
    surface.raycast = () => {}
    const back = stencilMaterial(
      plane,
      THREE.BackSide,
      THREE.IncrementWrapStencilOp
    )
    const front = stencilMaterial(
      plane,
      THREE.FrontSide,
      THREE.DecrementWrapStencilOp
    )
    // Prepare the stencil immediately before this cap, so transparent finishes
    // and separate layers cannot overwrite one another's stencil masks.
    surface.onBeforeRender = (renderer, scene, camera) => {
      renderer.clearStencil()
      source.modelViewMatrix.multiplyMatrices(
        camera.matrixWorldInverse,
        source.matrixWorld
      )
      source.normalMatrix.getNormalMatrix(source.modelViewMatrix)
      renderer.renderBufferDirect(
        camera,
        scene,
        source.geometry,
        back,
        source,
        { start: 0, count: Infinity }
      )
      renderer.renderBufferDirect(
        camera,
        scene,
        source.geometry,
        front,
        source,
        { start: 0, count: Infinity }
      )
    }
    surface.onAfterRender = (renderer) => renderer.clearStencil()
    geometry.addEventListener("dispose", () => {
      back.dispose()
      front.dispose()
    })
    source.add(surface)
    caps.push({ source, surface })
  }
  capsByGroup.set(group, caps)
}

export function updateSvgWipeCaps(
  group: THREE.Group | null,
  plane: THREE.Plane | null,
  active: boolean
) {
  if (!group) return
  const caps = capsByGroup.get(group)
  if (!caps) return
  if (active) group.updateWorldMatrix(true, true)
  const inverse = new THREE.Matrix4()
  const localPlane = new THREE.Plane()
  const point = new THREE.Vector3()
  for (const { source, surface } of caps) {
    surface.visible = active && plane !== null
    if (!surface.visible || !plane) continue
    inverse.copy(source.matrixWorld).invert()
    localPlane.copy(plane).applyMatrix4(inverse)
    localPlane.projectPoint(
      source.geometry.boundingSphere!.center,
      surface.position
    )
    surface.quaternion.setFromUnitVectors(
      planeNormal,
      point.copy(localPlane.normal).negate()
    )
    // Depth can change without rebuilding this solid or its cap.
    surface.scale.setScalar(
      Math.max(1, source.geometry.boundingSphere!.radius * 2.1) /
        (surface.geometry as THREE.PlaneGeometry).parameters.width
    )
    surface.updateMatrix()
    const positions = surface.geometry.getAttribute("position")
    const uv = surface.geometry.getAttribute("uv")
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(surface.matrix)
      uv.setXY(i, point.x / ICON_VIEWBOX_SIZE, point.y / ICON_VIEWBOX_SIZE)
    }
    uv.needsUpdate = true
  }
}
