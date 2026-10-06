"use client"

import {
  ForwardedRef,
  MutableRefObject,
  useRef,
  RefObject,
  useImperativeHandle,
} from "react"
import { flushSync } from "react-dom"
import * as THREE from "three"
import { applySvgModelScale } from "./SvgSceneUtils"
import { resizeSvgScene } from "./SvgSceneLifecycle"
import { animateSvgViewReset } from "./SvgViewReset"
import type { SvgCanvasProps, SvgCanvasRef } from "./SvgTypes"
import type { ExportRenderOptions } from "./SvgTypes"
import type { CanvasRecorderOptions } from "./useCanvasRecorder"
import type { ExportRenderSnapshot } from "./useSvgCanvasSceneRefs"

type CanvasRecorder = {
  startRecording: (
    canvas: HTMLCanvasElement | null,
    options?: CanvasRecorderOptions
  ) => void
  requestFrame: () => void
  stopRecording: (callback: (blob: Blob) => void) => void
  cancelRecording: () => void
}

type SvgCanvasImperativeHandleOptions = {
  exportCaptureRef: MutableRefObject<{
    onFrame: () => void
    onCancel: () => void
  } | null>
  setExportFrameProps: (props: SvgCanvasProps | null) => void
  ref: ForwardedRef<SvgCanvasRef>
  props: SvgCanvasProps
  canvasRef: RefObject<HTMLCanvasElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  rendererRef: MutableRefObject<THREE.WebGLRenderer | null>
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>
  exportRenderOptionsRef: MutableRefObject<ExportRenderOptions | null>
  exportRenderSnapshotRef: MutableRefObject<ExportRenderSnapshot | null>
  requestRenderRef: MutableRefObject<() => void>
  renderFrameRef: MutableRefObject<() => void>
  pivotGroupRef: MutableRefObject<THREE.Group | null>
  iconAGroupRef: MutableRefObject<THREE.Group | null>
  iconBGroupRef: MutableRefObject<THREE.Group | null>
  canvasRecorder: CanvasRecorder
  resetViewFrameRef: MutableRefObject<number | null>
  viewNudgeFrameRef: MutableRefObject<number | null>
  isInertiaActiveRef: MutableRefObject<boolean>
  rotationVelocityRef: MutableRefObject<{ x: number; y: number }>
  currentZoomRef: MutableRefObject<number>
  targetZoomRef: MutableRefObject<number>
  animationStartRef: MutableRefObject<number>
  cameraOrbitRef: MutableRefObject<{ x: number; y: number; z: number }>
  onViewRotationSet: SvgCanvasProps["onViewRotationSet"]
}

export function useSvgCanvasImperativeHandle({
  exportCaptureRef,
  ref,
  setExportFrameProps,
  props,
  canvasRef,
  containerRef,
  rendererRef,
  cameraRef,
  exportRenderOptionsRef,
  exportRenderSnapshotRef,
  requestRenderRef,
  renderFrameRef,
  pivotGroupRef,
  iconAGroupRef,
  iconBGroupRef,
  canvasRecorder,
  resetViewFrameRef,
  viewNudgeFrameRef,
  isInertiaActiveRef,
  rotationVelocityRef,
  currentZoomRef,
  targetZoomRef,
  animationStartRef,
  onViewRotationSet,
  cameraOrbitRef,
}: SvgCanvasImperativeHandleOptions) {
  const capturedCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const captureRenderedFrame = () =>
    new Promise<HTMLCanvasElement>((resolve, reject) => {
      exportCaptureRef.current?.onCancel()
      exportCaptureRef.current = {
        onCancel: () => reject(new Error("Render capture was canceled.")),
        onFrame: () => {
          try {
            const canvas = canvasRef.current
            if (!canvas) throw new Error("The export canvas is not ready.")
            const captured =
              capturedCanvasRef.current ?? document.createElement("canvas")
            capturedCanvasRef.current = captured
            captured.width = canvas.width
            captured.height = canvas.height
            const context = captured.getContext("2d")
            if (!context)
              throw new Error("The browser could not capture this frame.")
            context.drawImage(canvas, 0, 0)
            resolve(captured)
          } catch (error) {
            reject(error)
          }
        },
      }
      requestRenderRef.current()
    })
  const prepareExportRender = (options: ExportRenderOptions) => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    if (!renderer || !camera) {
      throw new Error("The 3D preview is not ready.")
    }
    if (exportRenderSnapshotRef.current) {
      throw new Error("Another render export is already running.")
    }

    const width = Math.max(64, Math.round(options.width))
    const height = Math.max(64, Math.round(options.height))
    exportRenderSnapshotRef.current = {
      size: renderer.getSize(new THREE.Vector2()),
      pixelRatio: renderer.getPixelRatio(),
      cameraAspect: camera.aspect,
      clearColor: renderer.getClearColor(new THREE.Color()).clone(),
      clearAlpha: renderer.getClearAlpha(),
    }
    exportRenderOptionsRef.current = {
      width,
      height,
      backgroundColor: options.backgroundColor,
    }
    renderer.setPixelRatio(1)
    renderer.setSize(width, height, false)
    renderer.setClearColor(
      options.backgroundColor ?? "#000000",
      options.backgroundColor ? 1 : 0
    )
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    requestRenderRef.current()
  }

  const restorePreviewRender = () => {
    exportCaptureRef.current?.onCancel()
    exportCaptureRef.current = null
    const renderer = rendererRef.current
    const camera = cameraRef.current
    setExportFrameProps(null)
    const snapshot = exportRenderSnapshotRef.current
    exportRenderOptionsRef.current = null
    exportRenderSnapshotRef.current = null
    if (!renderer || !camera || !snapshot) return

    renderer.setPixelRatio(snapshot.pixelRatio)
    renderer.setSize(snapshot.size.x, snapshot.size.y, false)
    renderer.setClearColor(snapshot.clearColor, snapshot.clearAlpha)
    camera.aspect = snapshot.cameraAspect
    camera.updateProjectionMatrix()
    requestRenderRef.current()
  }

  useImperativeHandle(ref, () => ({
    renderLayoutSnapshot() {
      if (!containerRef.current || exportRenderOptionsRef.current) return
      resizeSvgScene({
        container: containerRef.current,
        cameraRef,
        rendererRef,
        currentZoomRef,
      })
      renderFrameRef.current()
    },
    async exportGltf() {
      if (!pivotGroupRef.current) {
        return Promise.reject(
          new Error("The 3D preview is not ready to export yet.")
        )
      }
      const { exportFilamentGltf } = await import("./SvgExport")
      return exportFilamentGltf({
        pivotGroup: pivotGroupRef.current,
        props,
        sourceGroups: [iconAGroupRef.current, iconBGroupRef.current],
        applyModelScale: applySvgModelScale,
      })
    },

    async exportPng(options: ExportRenderOptions) {
      prepareExportRender(options)
      try {
        const canvas = await captureRenderedFrame()
        return await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) =>
              blob && blob.size > 0
                ? resolve(blob)
                : reject(new Error("The browser could not create the PNG.")),
            "image/png"
          )
        })
      } finally {
        restorePreviewRender()
      }
    },

    async renderExportFrame(frameProps: SvgCanvasProps) {
      flushSync(() => setExportFrameProps(frameProps))
      return captureRenderedFrame()
    },
    prepareExportRender,
    restorePreviewRender,

    startRecording(options?: CanvasRecorderOptions) {
      if (!rendererRef.current || !canvasRef.current) {
        throw new Error("The 3D preview canvas is not ready.")
      }
      canvasRecorder.startRecording(canvasRef.current, options)
    },

    requestRecordingFrame() {
      canvasRecorder.requestFrame()
    },

    stopRecording(callback: (blob: Blob) => void) {
      canvasRecorder.stopRecording(callback)
    },

    cancelRecording() {
      canvasRecorder.cancelRecording()
    },

    resetRotation() {
      animateSvgViewReset({
        resetViewFrameRef,
        viewNudgeFrameRef,
        isInertiaActiveRef,
        rotationVelocityRef,
        liveRotation: cameraOrbitRef.current,
        currentZoomRef,
        targetZoomRef,
        animationStartRef,
        onZoomChange: props.onZoomChange,
        onViewRotationSet,
      })
    },
  }))
}
