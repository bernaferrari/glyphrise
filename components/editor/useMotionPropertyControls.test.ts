import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { MotionPropertyControlsOptions } from "./MotionPropertyControlsModel"
import { useMotionPropertyControls } from "./useMotionPropertyControls"

function setup(overrides: Partial<MotionPropertyControlsOptions> = {}) {
  const options: MotionPropertyControlsOptions = {
    currentTime: 1.5,
    duration: 3,
    isPlaying: false,
    tracks: [
      {
        id: "scale",
        name: "Scale",
        color: "",
        min: 0.1,
        max: 3,
        defaultValue: 1,
        keyframes: [],
      },
    ],
    activeRotationOffset: { x: 0, y: 0, z: 0 },
    rotationAxisKeyframes: [],
    activeMoveOffset: { x: 0, y: 0, z: 0 },
    moveKeyframes: [],
    activeObjectScale: 1,
    objectScaleAxes: { x: 1, y: 1, z: 1 },
    setTracks: vi.fn(),
    setSelectedMotionTrackId: vi.fn(),
    setActiveRecipeId: vi.fn(),
    setExtrusionDepth: vi.fn(),
    setRotationOffset: vi.fn(),
    setRotationAxisKeyframes: vi.fn(),
    setPreviewRotationOffset: vi.fn(),
    setObjectScale: vi.fn(),
    setObjectScaleAxes: vi.fn(),
    setIsScaleLocked: vi.fn(),
    setMoveOffset: vi.fn(),
    setMoveKeyframes: vi.fn(),
    setKeyLightIntensity: vi.fn(),
    setGeometryQuality: vi.fn(),
    setQualityKeyframes: vi.fn(),
    canvas3DRef: {
      current: {
        renderLayoutSnapshot: vi.fn(),
        exportGltf: vi.fn(async () => {}),
        exportPng: vi.fn(async () => new Blob()),
        renderExportFrame: vi.fn(),
        prepareExportRender: vi.fn(),
        restorePreviewRender: vi.fn(),
        startRecording: vi.fn(),
        requestRecordingFrame: vi.fn(),
        stopRecording: vi.fn(),
        cancelRecording: vi.fn(),
        resetRotation: vi.fn(),
        commitRotationEdit: vi.fn(),
      },
    },
    ...overrides,
  }
  let controls!: ReturnType<typeof useMotionPropertyControls>
  function Harness() {
    controls = useMotionPropertyControls(options)
    return null
  }
  renderToStaticMarkup(createElement(Harness))
  return { options, controls }
}

describe("Reset view scale", () => {
  it("does not author transforms during playback", () => {
    const { options, controls } = setup({
      isPlaying: true,
      activeRotationOffset: { x: 0, y: 90, z: 0 },
      activeMoveOffset: { x: 12, y: 0, z: 0 },
      activeObjectScale: 2,
      objectScaleAxes: { x: 2, y: 1, z: 0.5 },
    })
    controls.resetView()
    expect(options.canvas3DRef.current?.resetRotation).toHaveBeenCalledOnce()
    expect(options.setRotationAxisKeyframes).not.toHaveBeenCalled()
    expect(options.setMoveKeyframes).not.toHaveBeenCalled()
    expect(options.setTracks).not.toHaveBeenCalled()
    expect(options.setRotationOffset).not.toHaveBeenCalled()
    expect(options.setMoveOffset).not.toHaveBeenCalled()
    expect(options.setObjectScale).not.toHaveBeenCalled()
    expect(options.setObjectScaleAxes).not.toHaveBeenCalled()
    expect(options.setActiveRecipeId).not.toHaveBeenCalled()
  })

  it("restores uniform scale without adding animation to a static object", () => {
    const { options, controls } = setup({ activeObjectScale: 2 })
    controls.resetView()
    expect(options.setObjectScale).toHaveBeenCalledWith(1)
    expect(options.setTracks).toHaveBeenCalledWith([
      expect.objectContaining({ defaultValue: 1, keyframes: [] }),
    ])
  })

  it("restores every separate scale axis", () => {
    const { options, controls } = setup({
      objectScaleAxes: { x: 0.1, y: 2, z: 0.6 },
    })
    controls.resetView()
    expect(options.setObjectScaleAxes).toHaveBeenCalledWith({
      x: 1,
      y: 1,
      z: 1,
    })
    expect(options.setTracks).not.toHaveBeenCalled()
  })

  it("keys animated scale at the playhead while preserving the other moments", () => {
    const { options, controls } = setup({
      activeObjectScale: 2,
      tracks: [
        {
          id: "scale",
          name: "Scale",
          color: "",
          min: 0.1,
          max: 3,
          defaultValue: 2,
          keyframes: [
            { id: "start", time: 0, value: 2, easing: "linear" },
            { id: "end", time: 3, value: 3, easing: "linear" },
          ],
        },
      ],
    })
    controls.resetView()
    expect(options.setTracks).toHaveBeenCalledWith([
      expect.objectContaining({
        keyframes: [
          expect.objectContaining({ id: "start", time: 0, value: 2 }),
          expect.objectContaining({ time: 1.5, value: 1 }),
          expect.objectContaining({ id: "end", time: 3, value: 3 }),
        ],
      }),
    ])
  })

  it("leaves a neutral object unchanged when resetting only the camera", () => {
    const { options, controls } = setup()
    controls.resetView()
    expect(options.canvas3DRef.current?.resetRotation).toHaveBeenCalledOnce()
    expect(options.setTracks).not.toHaveBeenCalled()
    expect(options.setObjectScale).not.toHaveBeenCalled()
    expect(options.setObjectScaleAxes).not.toHaveBeenCalled()
    expect(options.setActiveRecipeId).not.toHaveBeenCalled()
  })
})

describe("Canvas rotation preview", () => {
  it("keeps drag and momentum frames out of document history until the final commit", () => {
    const { controls, options } = setup()
    for (let frame = 1; frame <= 60; frame++) {
      controls.handleViewRotationSet(
        { x: 10, y: frame, z: 5 },
        { commit: false }
      )
    }
    expect(options.setPreviewRotationOffset).toHaveBeenLastCalledWith({
      x: 10,
      y: 60,
      z: 5,
    })
    expect(options.setRotationOffset).not.toHaveBeenCalled()
    expect(options.setRotationAxisKeyframes).not.toHaveBeenCalled()
    expect(options.setActiveRecipeId).not.toHaveBeenCalled()
    expect(options.setSelectedMotionTrackId).not.toHaveBeenCalled()

    controls.handleViewRotationSet({ x: 10, y: 60, z: 5 }, { commit: true })
    expect(options.setRotationOffset).toHaveBeenCalledExactlyOnceWith({
      x: 10,
      y: 60,
      z: 5,
    })
    expect(options.setRotationAxisKeyframes).toHaveBeenCalledOnce()
    expect(options.setPreviewRotationOffset).toHaveBeenLastCalledWith(null)
  })
})
