"use client"

import { useEffect, useRef, type MutableRefObject } from "react"
import * as THREE from "three"
import {
  OrientationGizmoRefs,
  updateOrientationGizmo,
} from "./OrientationGizmo"
import { getVisibleIconCenter } from "./SvgGeometryAnalysis"
import {
  applySvgPivotTransform,
  svgDisplayRotationFromDegrees,
} from "./SvgPivotTransform"
import {
  renderSvgScene,
  updateCenterMarker,
  updateLayerSelectionOutline,
} from "./SvgRenderHelpers"
import {
  ZOOM_DAMPING,
  advanceInertiaVelocity,
  shouldContinueSvgRenderLoop,
  shouldScheduleSvgRenderFrame,
  type RotationVelocity,
} from "./SvgRenderLoopModel"
import { framedCameraDistance } from "./SvgSceneUtils"
import { applySvgTransitionState } from "./SvgTransitionState"
import { prepareSvgScene } from "./SvgSceneWarmup"
import type { SvgCanvasLiveRenderProps } from "./useSvgCanvasLiveRefs"
import type { ExportRenderOptions } from "./SvgTypes"
import type { SvgResetTransform } from "./SvgViewReset"
import type { ExportRenderSnapshot } from "./useSvgCanvasSceneRefs"

type NullableRef<T> = MutableRefObject<T | null>

type UseSvgRenderLoopOptions = {
  exportCaptureRef: MutableRefObject<{
    onFrame: () => void
    onCancel: () => void
  } | null>
  sceneRef: NullableRef<THREE.Scene>
  rendererRef: NullableRef<THREE.WebGLRenderer>
  cameraRef: NullableRef<THREE.PerspectiveCamera>
  liveRenderPropsRef: MutableRefObject<SvgCanvasLiveRenderProps>
  resetTransformRef: MutableRefObject<SvgResetTransform | null>
  isInertiaActiveRef: MutableRefObject<boolean>
  rotationVelocityRef: MutableRefObject<RotationVelocity>
  applyViewRotationDelta: (delta: RotationVelocity) => void
  finishViewRotation: () => void
  pivotGroupRef: NullableRef<THREE.Group>
  iconAGroupRef: NullableRef<THREE.Group>
  iconBGroupRef: NullableRef<THREE.Group>
  currentZoomRef: MutableRefObject<number>
  targetZoomRef: MutableRefObject<number>
  orientationGizmoRefs: OrientationGizmoRefs
  clipPlaneARef: NullableRef<THREE.Plane>
  clipPlaneBRef: NullableRef<THREE.Plane>
  centerMarkerRef: NullableRef<THREE.Group>
  transformGizmoGroupRef: NullableRef<THREE.Group>
  exportRenderOptionsRef: MutableRefObject<ExportRenderOptions | null>
  exportRenderSnapshotRef: MutableRefObject<ExportRenderSnapshot | null>
  requestRenderRef: MutableRefObject<() => void>
  renderFrameRef: MutableRefObject<() => void>
  isDraggingRef: MutableRefObject<boolean>
  updateTransformGizmo: (
    center: THREE.Vector3 | null,
    camera: THREE.PerspectiveCamera
  ) => void
}

export function useSvgRenderLoop({
  exportCaptureRef,
  sceneRef,
  rendererRef,
  cameraRef,
  liveRenderPropsRef,
  resetTransformRef,
  isInertiaActiveRef,
  rotationVelocityRef,
  applyViewRotationDelta,
  finishViewRotation,
  pivotGroupRef,
  iconAGroupRef,
  iconBGroupRef,
  currentZoomRef,
  targetZoomRef,
  orientationGizmoRefs,
  clipPlaneARef,
  clipPlaneBRef,
  centerMarkerRef,
  transformGizmoGroupRef,
  exportRenderOptionsRef,
  exportRenderSnapshotRef,
  requestRenderRef,
  renderFrameRef,
  isDraggingRef,
  updateTransformGizmo,
}: UseSvgRenderLoopOptions) {
  const applyViewRotationDeltaRef = useRef(applyViewRotationDelta)
  const finishViewRotationRef = useRef(finishViewRotation)
  const updateTransformGizmoRef = useRef(updateTransformGizmo)

  useEffect(() => {
    applyViewRotationDeltaRef.current = applyViewRotationDelta
    finishViewRotationRef.current = finishViewRotation
  }, [applyViewRotationDelta, finishViewRotation])

  useEffect(() => {
    updateTransformGizmoRef.current = updateTransformGizmo
  }, [updateTransformGizmo])

  useEffect(() => {
    let animFrameId: number | null = null
    let disposed = false
    const gizmoOrientation = new THREE.Quaternion()
    const artworkOrientation = new THREE.Quaternion()
    const artworkEuler = new THREE.Euler()

    const scheduleFrame = () => {
      if (
        !shouldScheduleSvgRenderFrame({
          disposed,
          documentHidden: document.hidden,
          animationFrameId: animFrameId,
        })
      ) {
        return
      }

      animFrameId = requestAnimationFrame(renderLoop)
    }

    const renderLoop = () => {
      animFrameId = null
      if (disposed || document.hidden) return

      const scene = sceneRef.current
      const renderer = rendererRef.current
      const camera = cameraRef.current

      if (!scene || !renderer || !camera) {
        scheduleFrame()
        return
      }

      const exportRenderOptions = exportRenderOptionsRef.current
      const exportView = exportRenderSnapshotRef.current
      const liveProps =
        resetTransformRef.current && !exportRenderOptions
          ? { ...liveRenderPropsRef.current, ...resetTransformRef.current }
          : liveRenderPropsRef.current
      const progress = liveProps.transitionProgress

      if (isInertiaActiveRef.current && !exportRenderOptions) {
        applyViewRotationDeltaRef.current(rotationVelocityRef.current)
        const inertia = advanceInertiaVelocity(rotationVelocityRef.current)
        rotationVelocityRef.current = inertia.velocity
        isInertiaActiveRef.current = inertia.active
      }
      if (
        !isDraggingRef.current &&
        !isInertiaActiveRef.current &&
        !exportRenderOptions
      ) {
        finishViewRotationRef.current()
      }

      const displayRotation = svgDisplayRotationFromDegrees(
        liveProps.rotationOffset
      )

      if (pivotGroupRef.current) {
        applySvgPivotTransform({
          pivot: pivotGroupRef.current,
          iconA: iconAGroupRef.current,
          iconB: iconBGroupRef.current,
          liveProps,
          displayRotation,
        })
      }

      if (!exportRenderOptions) {
        currentZoomRef.current +=
          (targetZoomRef.current - currentZoomRef.current) * ZOOM_DAMPING
      }
      // Artwork rotation is shared by canvas, properties, and exports.
      // Only the preview zoom is held steady during encoding.
      const distance =
        framedCameraDistance(camera) /
        (exportView?.zoom ?? currentZoomRef.current)
      camera.rotation.set(0, 0, 0)
      camera.position.set(0, 0, distance)
      camera.updateMatrixWorld()

      artworkOrientation.setFromEuler(
        artworkEuler.set(
          displayRotation.x,
          displayRotation.y,
          displayRotation.z
        )
      )
      gizmoOrientation
        .copy(camera.quaternion)
        .invert()
        .multiply(artworkOrientation)
      updateOrientationGizmo(orientationGizmoRefs, gizmoOrientation)

      const { isCrossfade } = applySvgTransitionState({
        progress,
        transitionType: liveProps.transitionType,
        wipeDirection: liveProps.wipeDirection,
        iconA: iconAGroupRef.current,
        iconB: iconBGroupRef.current,
        pivot: pivotGroupRef.current,
        clipPlaneA: clipPlaneARef.current,
        clipPlaneB: clipPlaneBRef.current,
      })

      const shouldUpdateCenterTools = Boolean(
        liveProps.showCenterPoint || liveProps.showTransformGizmo
      )
      updateLayerSelectionOutline({
        groups: [iconAGroupRef.current, iconBGroupRef.current],
        selectedLayerId:
          exportRenderOptions || !liveProps.showSelectionOutline
            ? undefined
            : liveProps.selectedLayerId,
      })
      const visibleCenter = shouldUpdateCenterTools
        ? getVisibleIconCenter([iconAGroupRef.current, iconBGroupRef.current])
        : null

      updateCenterMarker({
        marker: centerMarkerRef.current,
        pivot: pivotGroupRef.current,
        visibleCenter,
        showCenterPoint: liveProps.showCenterPoint,
        iconGroups: [iconAGroupRef.current, iconBGroupRef.current],
      })
      updateTransformGizmoRef.current(visibleCenter, camera)

      prepareSvgScene({
        renderer,
        scene,
        camera,
        groups: [iconAGroupRef.current, iconBGroupRef.current],
      })

      renderSvgScene({
        isCrossfade,
        scene,
        renderer,
        camera,
        iconA: iconAGroupRef.current,
        iconB: iconBGroupRef.current,
        marker: centerMarkerRef.current,
        transformGizmo: transformGizmoGroupRef.current,
        showOverlays: !exportRenderOptions,
      })
      // Copy pixels before the browser clears the WebGL drawing buffer.
      const capture = exportCaptureRef.current
      exportCaptureRef.current = null
      capture?.onFrame()
      const shouldRenderContinuously = shouldContinueSvgRenderLoop({
        isPlaying: liveProps.isPlaying,
        isExporting: Boolean(exportRenderOptions),
        isDragging: isDraggingRef.current,
        isInertiaActive: isInertiaActiveRef.current,
        zoomDelta: targetZoomRef.current - currentZoomRef.current,
      })
      if (shouldRenderContinuously) scheduleFrame()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameId !== null) cancelAnimationFrame(animFrameId)
        animFrameId = null
        return
      }

      scheduleFrame()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    requestRenderRef.current = scheduleFrame
    renderFrameRef.current = () => {
      if (animFrameId !== null) cancelAnimationFrame(animFrameId)
      renderLoop()
    }
    scheduleFrame()

    return () => {
      disposed = true
      exportCaptureRef.current?.onCancel()
      exportCaptureRef.current = null
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      requestRenderRef.current = () => undefined
      renderFrameRef.current = () => undefined
      if (animFrameId !== null) cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
  }, [
    exportCaptureRef,
    cameraRef,
    centerMarkerRef,
    clipPlaneARef,
    clipPlaneBRef,
    currentZoomRef,
    iconAGroupRef,
    iconBGroupRef,
    isInertiaActiveRef,
    liveRenderPropsRef,
    resetTransformRef,
    orientationGizmoRefs,
    pivotGroupRef,
    rendererRef,
    rotationVelocityRef,
    sceneRef,
    targetZoomRef,
    transformGizmoGroupRef,
    exportRenderOptionsRef,
    exportRenderSnapshotRef,
    requestRenderRef,
    renderFrameRef,
    isDraggingRef,
  ])
}
