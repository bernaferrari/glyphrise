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

type NullableRef<T> = MutableRefObject<T | null>

type UseSvgRenderLoopOptions = {
  exportCaptureRef: MutableRefObject<{
    onFrame: () => void
    onCancel: () => void
  } | null>
  cameraOrbitRef: MutableRefObject<{ x: number; y: number; z: number }>
  sceneRef: NullableRef<THREE.Scene>
  rendererRef: NullableRef<THREE.WebGLRenderer>
  cameraRef: NullableRef<THREE.PerspectiveCamera>
  liveRenderPropsRef: MutableRefObject<SvgCanvasLiveRenderProps>
  isInertiaActiveRef: MutableRefObject<boolean>
  rotationVelocityRef: MutableRefObject<RotationVelocity>
  applyViewRotationDelta: (delta: RotationVelocity) => void
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
  cameraOrbitRef,
  sceneRef,
  rendererRef,
  cameraRef,
  liveRenderPropsRef,
  isInertiaActiveRef,
  rotationVelocityRef,
  applyViewRotationDelta,
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
  requestRenderRef,
  renderFrameRef,
  isDraggingRef,
  updateTransformGizmo,
}: UseSvgRenderLoopOptions) {
  const applyViewRotationDeltaRef = useRef(applyViewRotationDelta)
  const updateTransformGizmoRef = useRef(updateTransformGizmo)

  useEffect(() => {
    applyViewRotationDeltaRef.current = applyViewRotationDelta
  }, [applyViewRotationDelta])

  useEffect(() => {
    updateTransformGizmoRef.current = updateTransformGizmo
  }, [updateTransformGizmo])

  useEffect(() => {
    let animFrameId: number | null = null
    let disposed = false

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

      const liveProps = liveRenderPropsRef.current
      const exportRenderOptions = exportRenderOptionsRef.current
      const progress = liveProps.transitionProgress

      if (isInertiaActiveRef.current) {
        applyViewRotationDeltaRef.current(rotationVelocityRef.current)
        const inertia = advanceInertiaVelocity(rotationVelocityRef.current)
        rotationVelocityRef.current = inertia.velocity
        isInertiaActiveRef.current = inertia.active
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

      currentZoomRef.current +=
        (targetZoomRef.current - currentZoomRef.current) * ZOOM_DAMPING
      const orbit = exportRenderOptions
        ? { x: 0, y: 0 }
        : cameraOrbitRef.current
      const pitch = THREE.MathUtils.degToRad(
        Math.max(-85, Math.min(85, orbit.x))
      )
      const yaw = THREE.MathUtils.degToRad(orbit.y)
      const distance =
        framedCameraDistance(camera) /
        (exportRenderOptions ? 1 : currentZoomRef.current)
      camera.position.set(
        -distance * Math.sin(yaw) * Math.cos(pitch),
        distance * Math.sin(pitch),
        distance * Math.cos(yaw) * Math.cos(pitch)
      )
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()

      updateOrientationGizmo(orientationGizmoRefs, { x: -pitch, y: -yaw, z: 0 })

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
        marker: exportRenderOptions ? null : centerMarkerRef.current,
        transformGizmo: exportRenderOptions
          ? null
          : transformGizmoGroupRef.current,
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
    cameraOrbitRef,
    cameraRef,
    centerMarkerRef,
    clipPlaneARef,
    clipPlaneBRef,
    currentZoomRef,
    iconAGroupRef,
    iconBGroupRef,
    isInertiaActiveRef,
    liveRenderPropsRef,
    orientationGizmoRefs,
    pivotGroupRef,
    rendererRef,
    rotationVelocityRef,
    sceneRef,
    targetZoomRef,
    transformGizmoGroupRef,
    exportRenderOptionsRef,
    requestRenderRef,
    renderFrameRef,
    isDraggingRef,
  ])
}
