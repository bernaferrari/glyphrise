"use client"

import {
  ForwardedRef,
  MutableRefObject,
  RefObject,
  useImperativeHandle,
} from "react"
import * as THREE from "three"
import { applySvgModelScale } from "./SvgSceneUtils"
import { exportFilamentGltf } from "./SvgExport"
import { animateSvgViewReset } from "./SvgViewReset"
import type { SvgCanvasLiveRenderProps } from "./useSvgCanvasLiveRefs"
import type { SvgCanvasProps, SvgCanvasRef } from "./SvgTypes"
import type { CanvasRecorderOptions } from "./useCanvasRecorder"

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
  ref: ForwardedRef<SvgCanvasRef>
  props: SvgCanvasProps
  canvasRef: RefObject<HTMLCanvasElement | null>
  rendererRef: MutableRefObject<THREE.WebGLRenderer | null>
  pivotGroupRef: MutableRefObject<THREE.Group | null>
  iconAGroupRef: MutableRefObject<THREE.Group | null>
  iconBGroupRef: MutableRefObject<THREE.Group | null>
  canvasRecorder: CanvasRecorder
  resetViewFrameRef: MutableRefObject<number | null>
  viewNudgeFrameRef: MutableRefObject<number | null>
  isInertiaActiveRef: MutableRefObject<boolean>
  rotationVelocityRef: MutableRefObject<{ x: number; y: number }>
  liveRenderPropsRef: MutableRefObject<SvgCanvasLiveRenderProps>
  currentZoomRef: MutableRefObject<number>
  targetZoomRef: MutableRefObject<number>
  animationStartRef: MutableRefObject<number>
  onViewRotationSet: SvgCanvasProps["onViewRotationSet"]
}

export function useSvgCanvasImperativeHandle({
  ref,
  props,
  canvasRef,
  rendererRef,
  pivotGroupRef,
  iconAGroupRef,
  iconBGroupRef,
  canvasRecorder,
  resetViewFrameRef,
  viewNudgeFrameRef,
  isInertiaActiveRef,
  rotationVelocityRef,
  liveRenderPropsRef,
  currentZoomRef,
  targetZoomRef,
  animationStartRef,
  onViewRotationSet,
}: SvgCanvasImperativeHandleOptions) {
  useImperativeHandle(ref, () => ({
    exportGltf() {
      if (!pivotGroupRef.current) {
        return Promise.reject(
          new Error("The 3D preview is not ready to export yet.")
        )
      }
      return exportFilamentGltf({
        pivotGroup: pivotGroupRef.current,
        props,
        sourceGroups: [iconAGroupRef.current, iconBGroupRef.current],
        applyModelScale: applySvgModelScale,
      })
    },

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
        liveRotation: liveRenderPropsRef.current.rotationOffset,
        currentZoomRef,
        targetZoomRef,
        animationStartRef,
        onZoomChange: props.onZoomChange,
        onViewRotationSet,
      })
    },
  }))
}
