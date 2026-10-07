"use client"

import React, { useEffect, useState, forwardRef, useMemo, useRef } from "react"
import { gradientStopsSignature, pathRebuildSignature } from "./SvgSceneUtils"
import { updateGroupMaterialSettings } from "./SvgMaterialState"
import { updateSceneLights } from "./SvgSceneSetup"
import { SvgCanvasOverlays } from "./SvgCanvasOverlays"
import type { SvgCanvasProps, SvgCanvasRef } from "./SvgTypes"
import { useCanvasRecorder } from "./useCanvasRecorder"
import { useSvgCanvasImperativeHandle } from "./useSvgCanvasImperativeHandle"
import { useSvgCanvasLiveRefs } from "./useSvgCanvasLiveRefs"
import { useSvgModelGroups } from "./useSvgModelGroups"
import { useSvgRenderLoop } from "./useSvgRenderLoop"
import { useSvgRotationDrag } from "./useSvgRotationDrag"
import { useSvgViewNudge } from "./useSvgViewNudge"
import { useSvgCanvasSceneLifecycle } from "./useSvgCanvasSceneLifecycle"
import { useTransformGizmoInteractions } from "./useTransformGizmoInteractions"
import { useSvgCanvasSceneRefs } from "./useSvgCanvasSceneRefs"
export type {
  GradientStop,
  PathOverride,
  SvgCanvasProps,
  SvgCanvasRef,
} from "./SvgTypes"

export const SvgCanvas = forwardRef<SvgCanvasRef, SvgCanvasProps>(
  (incomingProps, ref) => {
    const [exportFrameProps, setExportFrameProps] =
      useState<SvgCanvasProps | null>(null)
    const props = exportFrameProps ?? incomingProps
    const exportCaptureRef = useRef<{
      onFrame: () => void
      onCancel: () => void
    } | null>(null)
    const {
      containerRef,
      canvasRef,
      rotationDragTooltipRef,
      sceneRef,
      rendererRef,
      cameraRef,
      animationStartRef,
      ambientLightRef,
      keyLightRef,
      softboxLightRef,
      rimLightRef,
      pivotGroupRef,
      iconAGroupRef,
      iconBGroupRef,
      centerMarkerRef,
      isDraggingRef,
      isInertiaActiveRef,
      hasViewDragMovedRef,
      pointerStartPositionRef,
      previousPointerPositionRef,
      rotationVelocityRef,
      activePointerIdRef,
      targetZoomRef,
      currentZoomRef,
      clipPlaneARef,
      clipPlaneBRef,
      orientationGizmoRefs,
      transformGizmoGroupRef,
      transformGizmoHitObjectsRef,
      rotationDragOverlayRef,
      selectionRaycasterRef,
      selectionPointerRef,
      resetViewFrameRef,
      exportRenderOptionsRef,
      exportRenderSnapshotRef,
      requestRenderRef,
      renderFrameRef,
    } = useSvgCanvasSceneRefs(props.zoom)
    const pathOverridesASignature = useMemo(
      () => pathRebuildSignature(props.pathOverridesA),
      [props.pathOverridesA]
    )
    const pathOverridesBSignature = useMemo(
      () => pathRebuildSignature(props.pathOverridesB),
      [props.pathOverridesB]
    )
    const [modelReady, setModelReady] = useState(false)
    const [modelError, setModelError] = useState<string | null>(null)
    const colorAStopsKey = useMemo(
      () => gradientStopsSignature(props.colorAStops),
      [props.colorAStops]
    )
    const colorBStopsKey = useMemo(
      () => gradientStopsSignature(props.colorBStops),
      [props.colorBStops]
    )

    const {
      liveRenderPropsRef,
      resetTransformRef,
      viewInertiaEnabledRef,
      onObjectScaleChangeRef,
      onObjectScaleAxisChangeRef,
      onMoveOffsetChangeRef,
      onRotationAxisChangeRef,
    } = useSvgCanvasLiveRefs(props)

    const canvasRecorder = useCanvasRecorder()

    const {
      beginTransformMove,
      beginTransformScale,
      beginTransformRotate,
      hitTransformGizmo,
      setTransformGizmoHighlight,
      updateTransformGizmo,
    } = useTransformGizmoInteractions({
      canvasRef,
      cameraRef,
      pivotGroupRef,
      transformGizmoGroupRef,
      transformGizmoHitObjectsRef,
      rotationDragOverlayRef,
      rotationDragTooltipRef,
      liveRenderPropsRef,
      onObjectScaleChangeRef,
      onObjectScaleAxisChangeRef,
      onMoveOffsetChangeRef,
      onRotationAxisChangeRef,
    })
    const cameraOrbitRef = useRef({ x: 0, y: 0, z: 0 })
    const onCameraRotationSetRef =
      useRef<SvgCanvasProps["onViewRotationSet"]>(undefined)
    onCameraRotationSetRef.current = (rotation) => {
      cameraOrbitRef.current = { ...cameraOrbitRef.current, ...rotation }
      requestRenderRef.current()
    }
    const cancelViewReset = () => {
      if (resetViewFrameRef.current === null) return false
      cancelAnimationFrame(resetViewFrameRef.current)
      resetViewFrameRef.current = null
      resetTransformRef.current = null
      return true
    }
    const {
      viewNudgeFrameRef,
      cancelViewNudge,
      nudgeViewRotation,
      alignViewToAxis,
    } = useSvgViewNudge({
      rotationRef: cameraOrbitRef,
      isInertiaActiveRef,
      rotationVelocityRef,
      onViewRotationSetRef: onCameraRotationSetRef,
    })

    useEffect(() => {
      props.onModelReadyChange?.(modelReady)
    }, [modelReady, props.onModelReadyChange])

    const { applyViewRotationDelta } = useSvgRotationDrag({
      cameraOrbitRef,
      onCameraRotationSet: (rotation) =>
        onCameraRotationSetRef.current?.(rotation),
    })

    useSvgCanvasImperativeHandle({
      exportCaptureRef,
      setExportFrameProps,
      ref,
      props,
      liveRenderPropsRef,
      resetTransformRef,
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
      cameraOrbitRef,
      onViewRotationSet: onCameraRotationSetRef.current,
    })

    // Synchronize sidebar zooms with internal targetZoomRef
    useEffect(() => {
      targetZoomRef.current = props.zoom
    }, [props.zoom])

    useSvgCanvasSceneLifecycle({
      props,
      canvasRef,
      containerRef,
      sceneRef,
      rendererRef,
      cameraRef,
      animationStartRef,
      ambientLightRef,
      keyLightRef,
      softboxLightRef,
      rimLightRef,
      pivotGroupRef,
      iconAGroupRef,
      iconBGroupRef,
      centerMarkerRef,
      clipPlaneARef,
      clipPlaneBRef,
      transformGizmoGroupRef,
      transformGizmoHitObjectsRef,
      rotationDragOverlayRef,
      selectionRaycasterRef,
      selectionPointerRef,
      resetViewFrameRef,
      isDraggingRef,
      isInertiaActiveRef,
      hasViewDragMovedRef,
      activePointerIdRef,
      pointerStartPositionRef,
      previousPointerPositionRef,
      rotationVelocityRef,
      viewInertiaEnabledRef,
      targetZoomRef,
      currentZoomRef,
      hitTransformGizmo,
      beginTransformScale,
      beginTransformMove,
      beginTransformRotate,
      setTransformGizmoHighlight,
      beginViewDrag: () => {
        cancelViewReset()
        cancelViewNudge()
      },
      applyViewRotationDelta,
      cancelViewNudge,
      requestRenderRef,
    })

    // Effect: Updates Lights
    useEffect(() => {
      updateSceneLights({
        props,
        ambientLight: ambientLightRef.current,
        keyLight: keyLightRef.current,
        softboxLight: softboxLightRef.current,
        rimLight: rimLightRef.current,
        renderer: rendererRef.current,
      })
    }, [
      props.ambientColor,
      props.ambientIntensity,
      props.keyLightColor,
      props.keyLightIntensity,
      props.keyLightPosition,
      props.keyLightSoftness,
      props.rimLightColor,
      props.rimLightIntensity,
      props.materialPreset,
    ])

    useSvgModelGroups({
      props,
      pivotGroupRef,
      iconAGroupRef,
      iconBGroupRef,
      clipPlaneARef,
      clipPlaneBRef,
      setModelReady,
      setModelError,
      pathOverridesASignature,
      pathOverridesBSignature,
      colorAStopsKey,
      colorBStopsKey,
    })

    useEffect(() => {
      const materialSettings = {
        materialPreset: props.materialPreset,
        roughness: props.roughness,
        metalness: props.metalness,
        reflectance: props.reflectance,
        clearcoat: props.clearcoat,
        clearcoatRoughness: props.clearcoatRoughness,
        transmission: props.transmission,
        thickness: props.thickness,
        emissiveIntensity: props.emissiveIntensity,
        wireframe: props.wireframe,
      }
      updateGroupMaterialSettings(iconAGroupRef.current, materialSettings)
      updateGroupMaterialSettings(iconBGroupRef.current, materialSettings)
    }, [
      props.materialPreset,
      props.roughness,
      props.metalness,
      props.reflectance,
      props.clearcoat,
      props.clearcoatRoughness,
      props.transmission,
      props.thickness,
      props.emissiveIntensity,
      props.wireframe,
    ])

    useSvgRenderLoop({
      exportCaptureRef,
      cameraOrbitRef,
      sceneRef,
      rendererRef,
      cameraRef,
      liveRenderPropsRef,
      resetTransformRef,
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
    })

    // React/property changes invalidate one frame. The loop keeps itself alive
    // only during playback, gestures, inertia, zoom settling, and export.
    useEffect(() => {
      requestRenderRef.current()
    }, [modelReady, props, requestRenderRef])

    return (
      <div
        ref={containerRef}
        role="region"
        aria-label="3D preview"
        aria-describedby="glyphrise-preview-instructions"
        className="relative h-full min-h-0 w-full overflow-hidden bg-preview-background"
      >
        <span id="glyphrise-preview-instructions" className="sr-only">
          Drag to orbit the preview camera; pinch or scroll to zoom. These
          change the view only. Use Transform properties or the transform gizmo
          to rotate the artwork.
        </span>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
        />
        <SvgCanvasOverlays
          showOrientationGizmo={props.showOrientationGizmo}
          modelReady={modelReady}
          modelError={modelError}
          orientationGizmoRefs={orientationGizmoRefs}
          rotationDragTooltipRef={rotationDragTooltipRef}
          onAlignViewToAxis={(axis) => {
            cancelViewReset()
            alignViewToAxis(axis)
          }}
          onNudgeViewRotation={(axis, direction) => {
            // An arrow after Reset steps from its destination, rather than
            // snapping an almost-zero tween value back to zero.
            if (cancelViewReset()) {
              onCameraRotationSetRef.current?.({ x: 0, y: 0, z: 0 })
              currentZoomRef.current = targetZoomRef.current
            }
            nudgeViewRotation(axis, direction)
          }}
        />
      </div>
    )
  }
)

SvgCanvas.displayName = "SvgCanvas"
