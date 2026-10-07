// @vitest-environment happy-dom
import { act, createRef } from "react"
import { createRoot } from "react-dom/client"
import * as THREE from "three"
import { expect, it, vi } from "vitest"
import { useSvgCanvasSceneRefs } from "./useSvgCanvasSceneRefs"
import { useSvgCanvasImperativeHandle } from "./useSvgCanvasImperativeHandle"
import { useSvgRenderLoop } from "./useSvgRenderLoop"
import type { SvgCanvasLiveRenderProps } from "./useSvgCanvasLiveRefs"
import type { SvgCanvasProps, SvgCanvasRef } from "./SvgTypes"

vi.mock("./SvgSceneWarmup", () => ({ prepareSvgScene: vi.fn() }))
vi.mock("./SvgRenderHelpers", () => ({
  renderSvgScene: vi.fn(),
  updateCenterMarker: vi.fn(),
  updateLayerSelectionOutline: vi.fn(),
}))

it("keeps the canvas angle and zoom for still and successive video export frames", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1)
  )
  vi.stubGlobal("cancelAnimationFrame", vi.fn())
  const root = createRoot(document.createElement("div"))
  const canvas = createRef<SvgCanvasRef>()
  const camera = new THREE.PerspectiveCamera(45, 1)
  const pivot = new THREE.Group()
  const exportCaptureRef = { current: null }
  const liveRenderPropsRef: { current: SvgCanvasLiveRenderProps } = {
    current: {
      rotationOffset: { x: 35, y: -60, z: 0 },
      transitionProgress: 0,
      transitionType: "fade",
      wipeDirection: { x: 1, y: 0 },
      innerElementScale: { x: 1, y: 1, z: 1 },
      objectScale: 1,
      objectScaleAxes: { x: 1, y: 1, z: 1 },
      moveOffset: { x: 0, y: 0, z: 0 },
      showCenterPoint: false,
      showSelectionOutline: false,
      showTransformGizmo: false,
      selectedLayerId: null,
      keyLightIntensity: 1,
      isPlaying: false,
    },
  }
  const resetTransformRef = { current: null }
  const viewNudgeFrameRef = { current: null }
  let refs!: ReturnType<typeof useSvgCanvasSceneRefs>
  function Harness() {
    refs = useSvgCanvasSceneRefs(1.7)
    refs.sceneRef.current = new THREE.Scene()
    refs.cameraRef.current = camera
    refs.pivotGroupRef.current = pivot
    refs.rendererRef.current = {
      getSize: (target: THREE.Vector2) => target.set(400, 400),
      getPixelRatio: () => 2,
      getClearColor: (target: THREE.Color) => target.set("#000000"),
      getClearAlpha: () => 1,
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
    } as unknown as THREE.WebGLRenderer
    useSvgCanvasImperativeHandle({
      ...refs,
      ref: canvas,
      props: {} as SvgCanvasProps,
      exportCaptureRef,
      liveRenderPropsRef,
      resetTransformRef,
      viewNudgeFrameRef,
      setExportFrameProps: vi.fn(),
      finishViewRotation: vi.fn(),
      canvasRecorder: {
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        cancelRecording: vi.fn(),
        requestFrame: vi.fn(),
      },
    })
    useSvgRenderLoop({
      ...refs,
      exportCaptureRef,
      liveRenderPropsRef,
      resetTransformRef,
      finishViewRotation: vi.fn(),
      applyViewRotationDelta: ({ x, y }) => {
        liveRenderPropsRef.current.rotationOffset.x += x
        liveRenderPropsRef.current.rotationOffset.y += y
      },
      updateTransformGizmo: vi.fn(),
    })
    return null
  }
  try {
    act(() => root.render(<Harness />))
    refs.renderFrameRef.current()
    const angle = pivot.quaternion.clone()
    const distance = camera.position.length()
    canvas.current!.prepareExportRender({
      width: 256,
      height: 256,
      backgroundColor: null,
    })
    refs.renderFrameRef.current()
    expect(pivot.quaternion.angleTo(angle)).toBeCloseTo(0, 6)
    expect(camera.position.length()).toBeCloseTo(distance, 6)
    // Encoding many frames must not advance leftover orbit or zoom inertia.
    refs.isInertiaActiveRef.current = true
    refs.rotationVelocityRef.current = { x: 2, y: 3 }
    refs.targetZoomRef.current = 2.5
    for (let frame = 0; frame < 3; frame++) {
      refs.renderFrameRef.current()
      expect(pivot.quaternion.angleTo(angle)).toBeCloseTo(0, 6)
      expect(camera.position.length()).toBeCloseTo(distance, 6)
    }
    canvas.current!.restorePreviewRender()
    refs.isInertiaActiveRef.current = false
    refs.targetZoomRef.current = 1.7
    refs.renderFrameRef.current()
    expect(pivot.quaternion.angleTo(angle)).toBeCloseTo(0, 6)
    expect(camera.position.length()).toBeCloseTo(distance, 6)
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
