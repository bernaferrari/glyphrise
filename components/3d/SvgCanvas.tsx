"use client"

import React, {
  useEffect,
  useState,
  forwardRef,
  useMemo,
  useCallback,
  useRef,
} from "react"
import * as THREE from "three"
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
  (props, ref) => {
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
      cameraOrbitRef.current.x = Math.max(
        -85,
        Math.min(85, cameraOrbitRef.current.x)
      )
      requestRenderRef.current()
    }
    const { viewNudgeFrameRef, cancelViewNudge, nudgeViewRotation } =
      useSvgViewNudge({
        rotationRef: cameraOrbitRef,
        isInertiaActiveRef,
        rotationVelocityRef,
        onViewRotationSetRef: onCameraRotationSetRef,
      })

    useEffect(() => {
      props.onModelReadyChange?.(modelReady)
    }, [modelReady, props.onModelReadyChange])

    const applyViewRotationDelta = useCallback(
      (delta: { x: number; y: number }) => {
        const current = cameraOrbitRef.current
        onCameraRotationSetRef.current?.({
          x: current.x + THREE.MathUtils.radToDeg(delta.x),
          y: current.y + THREE.MathUtils.radToDeg(delta.y),
        })
      },
      []
    )

    useSvgCanvasImperativeHandle({
      ref,
      props,
      canvasRef,
      rendererRef,
      cameraRef,
      exportRenderOptionsRef,
      exportRenderSnapshotRef,
      requestRenderRef,
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
        className="relative h-full min-h-0 w-full overflow-hidden bg-[oklch(0.13_0.012_280)]"
      >
        <span id="glyphrise-preview-instructions" className="sr-only">
          Drag to orbit the camera; scroll to zoom. Camera changes are
          preview-only. Use Transform controls to rotate the icon in your
          export.
        </span>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
        />
        <SvgCanvasOverlays
          modelReady={modelReady}
          modelError={modelError}
          orientationGizmoRefs={orientationGizmoRefs}
          rotationDragTooltipRef={rotationDragTooltipRef}
          onNudgeViewRotation={nudgeViewRotation}
        />
      </div>
    )
  }
)

SvgCanvas.displayName = "SvgCanvas"
