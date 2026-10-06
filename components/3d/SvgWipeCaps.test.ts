import * as THREE from "three"
import { describe, expect, it, vi } from "vitest"
import { attachSvgWipeCaps, updateSvgWipeCaps } from "./SvgWipeCaps"
import { updateGroupMaterialState } from "./SvgMaterialState"
import { disposeObjectTree } from "./SvgSceneUtils"
import { prepareFilamentExportObject } from "./SvgExport"

function setup() {
  const source = new THREE.Mesh(
    new THREE.BoxGeometry(2, 4, 6).translate(12, 12, 0),
    new THREE.MeshStandardMaterial({ color: "#aa77cc", roughness: 0.3 })
  )
  const group = new THREE.Group().add(source)
  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -12)
  attachSvgWipeCaps(group, plane)
  const cap = source.children[0] as THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshStandardMaterial
  >
  return { group, source, plane, cap }
}

describe("solid wipe caps", () => {
  it("continues covering the cut after depth changes in the retained geometry", () => {
    const { group, source, plane, cap } = setup()
    source.geometry.scale(1, 1, 10)
    source.geometry.computeBoundingSphere()
    updateSvgWipeCaps(group, plane, true)
    expect(cap.scale.x).toBeGreaterThan(1)
    expect(cap.geometry.parameters.width * cap.scale.x).toBeCloseTo(
      source.geometry.boundingSphere!.radius * 2.1
    )
    disposeObjectTree(group)
  })
  it("closes the local cut under rotation, translation, and nonuniform scale", () => {
    const { group, source, plane, cap } = setup()
    group.rotation.set(0.5, 0.8, 0.2)
    group.position.set(1, -2, 3)
    group.scale.set(2, 1, 3)
    group.updateMatrixWorld(true)
    plane.applyMatrix4(source.matrixWorld)
    updateSvgWipeCaps(group, plane, true)
    group.updateMatrixWorld(true)
    expect(cap.visible).toBe(true)
    const position = cap.geometry.getAttribute("position")
    for (let i = 0; i < position.count; i++) {
      const vertex = new THREE.Vector3()
        .fromBufferAttribute(position, i)
        .applyMatrix4(cap.matrixWorld)
      expect(plane.distanceToPoint(vertex)).toBeCloseTo(0, 5)
    }
    expect(cap.position.distanceTo(new THREE.Vector3(12, 12, 0))).toBeLessThan(
      1e-10
    )
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(cap.quaternion)
    expect(normal.x).toBeCloseTo(-1)
  })

  it("samples the icon's gradient coordinates and keeps the cap unclipped", () => {
    const { group, plane, cap, source } = setup()
    updateGroupMaterialState(group, { opacity: 1, clippingPlanes: [plane] })
    updateSvgWipeCaps(group, plane, true)
    const position = cap.geometry.getAttribute("position")
    const uv = cap.geometry.getAttribute("uv")
    for (let i = 0; i < position.count; i++) {
      const vertex = new THREE.Vector3()
        .fromBufferAttribute(position, i)
        .applyMatrix4(cap.matrix)
      expect(uv.getX(i)).toBeCloseTo(vertex.x / 24)
      expect(uv.getY(i)).toBeCloseTo(vertex.y / 24)
    }
    expect(cap.material.color.equals(source.material.color)).toBe(true)
    expect(cap.material.clippingPlanes).toBeNull()
    updateSvgWipeCaps(group, plane, false)
    expect(cap.visible).toBe(false)
  })

  it("stencils each solid immediately before its cap, and releases the mask materials", () => {
    const { cap, source, group } = setup()
    const renderBufferDirect = vi.fn()
    const clearStencil = vi.fn()
    const renderer = {
      renderBufferDirect,
      clearStencil,
    } as unknown as THREE.WebGLRenderer
    cap.onBeforeRender(
      renderer,
      new THREE.Scene(),
      new THREE.PerspectiveCamera(),
      cap.geometry,
      cap.material,
      group
    )
    expect(clearStencil).toHaveBeenCalledOnce()
    expect(renderBufferDirect).toHaveBeenCalledTimes(2)
    const masks = renderBufferDirect.mock.calls.map(
      (call) => call[3] as THREE.MeshBasicMaterial
    )
    expect(masks.map((material) => material.side)).toEqual([
      THREE.BackSide,
      THREE.FrontSide,
    ])
    expect(
      masks.every((material) => !material.colorWrite && !material.depthWrite)
    ).toBe(true)
    expect(
      renderBufferDirect.mock.calls.every((call) => call[2] === source.geometry)
    ).toBe(true)
    const disposed = masks.map((material) => vi.spyOn(material, "dispose"))
    disposeObjectTree(group)
    disposed.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce())
  })

  it("excludes the temporary cutting surfaces from complete model exports", () => {
    const { group, plane } = setup()
    updateSvgWipeCaps(group, plane, true)
    const exported = prepareFilamentExportObject(
      new THREE.Group(),
      {
        materialPreset: "satin",
        enableGradient: false,
        rotationOffset: { x: 0, y: 0, z: 0 },
        objectScale: 1,
        moveOffset: { x: 0, y: 0, z: 0 },
        transitionProgress: 0,
      },
      [group],
      () => {}
    )
    const meshes: THREE.Mesh[] = []
    exported.traverse((object) => {
      if (object instanceof THREE.Mesh) meshes.push(object)
    })
    expect(meshes).toHaveLength(1)
    expect(meshes[0].userData.wipeCap).toBeUndefined()
  })
})
