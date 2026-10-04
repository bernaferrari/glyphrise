import * as THREE from "three"
import { expect, it, vi } from "vitest"
import { prepareSvgScene } from "./SvgSceneWarmup"

const setup = () => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const group = new THREE.Group()
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial()
  )
  group.add(mesh)
  group.visible = false
  scene.add(group)
  const previousTarget = new THREE.WebGLRenderTarget(8, 8)
  const renderer = {
    getRenderTarget: () => previousTarget,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget: vi.fn(),
    render: vi.fn(() => {
      expect(group.visible).toBe(true)
      expect(mesh.frustumCulled).toBe(false)
    }),
  }
  const options = {
    renderer: renderer as unknown as THREE.WebGLRenderer,
    scene,
    camera,
    groups: [group],
  }
  return { group, mesh, renderer, previousTarget, options }
}

it("prepares hidden icons once, then restores preview visibility and the render target", () => {
  const { group, mesh, renderer, previousTarget, options } = setup()
  const disposed = vi.spyOn(THREE.WebGLRenderTarget.prototype, "dispose")
  try {
    prepareSvgScene(options)
    expect(renderer.render).toHaveBeenCalledOnce()
    expect(group.visible).toBe(false)
    expect(mesh.frustumCulled).toBe(true)
    expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(
      previousTarget,
      0,
      0
    )
    expect(disposed).toHaveBeenCalledOnce()
    prepareSvgScene(options)
    expect(renderer.render).toHaveBeenCalledOnce()
  } finally {
    disposed.mockRestore()
  }
})

it("restores the scene even if preparation fails, and allows another attempt", () => {
  const { group, mesh, renderer, previousTarget, options } = setup()
  renderer.render.mockImplementationOnce(() => {
    throw new Error("Context lost")
  })
  expect(() => prepareSvgScene(options)).toThrow("Context lost")
  expect(group.visible).toBe(false)
  expect(mesh.frustumCulled).toBe(true)
  expect(renderer.setRenderTarget).toHaveBeenLastCalledWith(
    previousTarget,
    0,
    0
  )
  prepareSvgScene(options)
  expect(renderer.render).toHaveBeenCalledTimes(2)
})
