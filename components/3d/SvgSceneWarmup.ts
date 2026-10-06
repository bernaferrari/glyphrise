import * as THREE from "three"

const preparedRenderers = new WeakSet<THREE.WebGLRenderer>()

/** Prime incoming geometry, textures, and shadow shaders without flashing it onscreen. */
export const prepareSvgScene = ({
  renderer,
  scene,
  camera,
  groups,
}: {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  groups: Array<THREE.Group | null>
}) => {
  if (
    preparedRenderers.has(renderer) ||
    !groups.some((group) => group?.children.length)
  )
    return
  const target = new THREE.WebGLRenderTarget(1, 1, { stencilBuffer: true })
  const previousTarget = renderer.getRenderTarget()
  const previousCubeFace = renderer.getActiveCubeFace()
  const previousMipmapLevel = renderer.getActiveMipmapLevel()
  const visibility = groups.flatMap((group) =>
    group ? [{ group, visible: group.visible }] : []
  )
  const meshes: Array<{
    mesh: THREE.Mesh
    frustumCulled: boolean
    visible: boolean
  }> = []
  try {
    visibility.forEach(({ group }) => {
      group.visible = true
      group.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        meshes.push({
          mesh,
          frustumCulled: mesh.frustumCulled,
          visible: mesh.visible,
        })
        if (mesh.userData.wipeCap) mesh.visible = true
        mesh.frustumCulled = false
      })
    })
    // compileAsync alone does not prepare Three's internally-created shadow
    // materials or upload a hidden icon's buffers. A real tiny render does.
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
    preparedRenderers.add(renderer)
  } finally {
    visibility.forEach(({ group, visible }) => {
      group.visible = visible
    })
    meshes.forEach(({ mesh, frustumCulled, visible }) => {
      mesh.visible = visible
      mesh.frustumCulled = frustumCulled
    })
    renderer.setRenderTarget(
      previousTarget,
      previousCubeFace,
      previousMipmapLevel
    )
    target.dispose()
  }
}
