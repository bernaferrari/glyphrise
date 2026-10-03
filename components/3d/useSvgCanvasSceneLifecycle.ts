"use client"

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import * as THREE from "three"
import type { TransformAxis, TransformGizmoHandle } from "./TransformGizmo"
import {
  bindSvgSceneResize,
  createSvgSceneResources,
  disposeSvgSceneResources,
} from "./SvgSceneLifecycle"
import { bindSvgCanvasPointerInteractions } from "./SvgCanvasInteractions"
import type { SvgCanvasProps } from "./SvgTypes"
import { useLatestRef } from "@/lib/use-latest-ref"

type PointerPosition = { x: number; y: number }
type RotationVelocity = { x: number; y: number }

type NullableRef<T> = MutableRefObject<T | null>

type SvgCanvasSceneLifecycleOptions = {
  props: SvgCanvasProps
  canvasRef: RefObject<HTMLCanvasElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  sceneRef: NullableRef<THREE.Scene>
  rendererRef: NullableRef<THREE.WebGLRenderer>
  cameraRef: NullableRef<THREE.PerspectiveCamera>
  animationStartRef: MutableRefObject<number>
  ambientLightRef: NullableRef<THREE.AmbientLight>
  keyLightRef: NullableRef<THREE.DirectionalLight>
  softboxLightRef: NullableRef<THREE.RectAreaLight>
  rimLightRef: NullableRef<THREE.DirectionalLight>
  pivotGroupRef: NullableRef<THREE.Group>
  iconAGroupRef: NullableRef<THREE.Group>
  iconBGroupRef: NullableRef<THREE.Group>
  centerMarkerRef: NullableRef<THREE.Group>
  clipPlaneARef: NullableRef<THREE.Plane>
  clipPlaneBRef: NullableRef<THREE.Plane>
  transformGizmoGroupRef: NullableRef<THREE.Group>
  transformGizmoHitObjectsRef: MutableRefObject<THREE.Object3D[]>
  rotationDragOverlayRef: NullableRef<THREE.Group>
  selectionRaycasterRef: MutableRefObject<THREE.Raycaster>
  selectionPointerRef: MutableRefObject<THREE.Vector2>
  resetViewFrameRef: MutableRefObject<number | null>
  isDraggingRef: MutableRefObject<boolean>
  isInertiaActiveRef: MutableRefObject<boolean>
  hasViewDragMovedRef: MutableRefObject<boolean>
  activePointerIdRef: MutableRefObject<number | null>
  pointerStartPositionRef: MutableRefObject<PointerPosition>
  previousPointerPositionRef: MutableRefObject<PointerPosition>
  rotationVelocityRef: MutableRefObject<RotationVelocity>
  viewInertiaEnabledRef: MutableRefObject<boolean>
  targetZoomRef: MutableRefObject<number>
  currentZoomRef: MutableRefObject<number>
  hitTransformGizmo: (event: PointerEvent) => TransformGizmoHandle | null
  beginTransformScale: (event: PointerEvent, axis?: TransformAxis) => void
  beginTransformMove: (axis: TransformAxis, event: PointerEvent) => void
  beginTransformRotate: (axis: TransformAxis, event: PointerEvent) => void
  setTransformGizmoHighlight: (
    hovered: TransformGizmoHandle | null,
    active?: TransformGizmoHandle | null
  ) => void
  beginViewDrag: (event: PointerEvent) => void
  applyViewRotationDelta: (delta: RotationVelocity) => void
  cancelViewNudge: () => void
  requestRenderRef: MutableRefObject<() => void>
}

export function useSvgCanvasSceneLifecycle({
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
  beginViewDrag,
  applyViewRotationDelta,
  cancelViewNudge,
  requestRenderRef,
}: SvgCanvasSceneLifecycleOptions) {
  const hitTransformGizmoRef = useLatestRef(hitTransformGizmo)
  const beginTransformScaleRef = useLatestRef(beginTransformScale)
  const beginTransformMoveRef = useLatestRef(beginTransformMove)
  const beginTransformRotateRef = useLatestRef(beginTransformRotate)
  const setTransformGizmoHighlightRef = useLatestRef(setTransformGizmoHighlight)
  const beginViewDragRef = useLatestRef(beginViewDrag)
  const applyViewRotationDeltaRef = useLatestRef(applyViewRotationDelta)
  const cancelViewNudgeRef = useLatestRef(cancelViewNudge)
  const onZoomChangeRef = useLatestRef(props.onZoomChange)
  const selectedIconColorRoleRef = useLatestRef(props.selectedIconColorRole)
  const onSelectLayerRef = useLatestRef(props.onSelectLayer)
  const onDeselectLayersRef = useLatestRef(props.onDeselectLayers)
  const sceneCreationPropsRef = useRef(props)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const { renderer, studioEnvironment } = createSvgSceneResources({
      canvas,
      container,
      props: sceneCreationPropsRef.current,
      refs: {
        sceneRef,
        rendererRef,
        cameraRef,
        animationStartRef,
        pivotGroupRef,
        centerMarkerRef,
        transformGizmoGroupRef,
        transformGizmoHitObjectsRef,
        rotationDragOverlayRef,
        clipPlaneARef,
        clipPlaneBRef,
        ambientLightRef,
        keyLightRef,
        softboxLightRef,
        rimLightRef,
      },
    })
    const unbindCanvasPointerInteractions = bindSvgCanvasPointerInteractions({
      canvas,
      hitTransformGizmo: (event) => hitTransformGizmoRef.current(event),
      beginTransformScale: (event, axis) =>
        beginTransformScaleRef.current(event, axis),
      beginTransformMove: (axis, event) =>
        beginTransformMoveRef.current(axis, event),
      beginTransformRotate: (axis, event) =>
        beginTransformRotateRef.current(axis, event),
      setTransformGizmoHighlight: (hovered, active) =>
        setTransformGizmoHighlightRef.current(hovered, active),
      beginViewDrag: (event) => beginViewDragRef.current(event),
      applyViewRotationDelta: (delta) =>
        applyViewRotationDeltaRef.current(delta),
      isDraggingRef,
      isInertiaActiveRef,
      hasViewDragMovedRef,
      activePointerIdRef,
      pointerStartPositionRef,
      previousPointerPositionRef,
      onZoomChange: (zoom) => onZoomChangeRef.current?.(zoom),
      rotationVelocityRef,
      viewInertiaEnabledRef,
      targetZoomRef,
      currentZoomRef,
      animationStartRef,
      iconAGroupRef,
      iconBGroupRef,
      selectedIconColorRole: () => selectedIconColorRoleRef.current,
      sceneRef,
      cameraRef,
      selectionRaycasterRef,
      selectionPointerRef,
      onSelectLayer: (layerId) => onSelectLayerRef.current?.(layerId),
      onDeselectLayers: () => onDeselectLayersRef.current?.(),
      requestRender: () => requestRenderRef.current(),
    })
    const unbindSceneResize = bindSvgSceneResize({
      container,
      cameraRef,
      rendererRef,
      currentZoomRef,
      requestRender: () => requestRenderRef.current(),
    })

    return () => {
      unbindSceneResize()
      unbindCanvasPointerInteractions()
      disposeSvgSceneResources({
        refs: {
          transformGizmoGroupRef,
          rotationDragOverlayRef,
          transformGizmoHitObjectsRef,
        },
        renderer,
        studioEnvironment,
      })
      cancelViewNudgeRef.current()
      if (resetViewFrameRef.current !== null) {
        cancelAnimationFrame(resetViewFrameRef.current)
        resetViewFrameRef.current = null
      }
    }
  }, [
    ambientLightRef,
    animationStartRef,
    applyViewRotationDeltaRef,
    beginViewDragRef,
    beginTransformMoveRef,
    beginTransformRotateRef,
    beginTransformScaleRef,
    cameraRef,
    canvasRef,
    cancelViewNudgeRef,
    centerMarkerRef,
    clipPlaneARef,
    clipPlaneBRef,
    containerRef,
    currentZoomRef,
    hasViewDragMovedRef,
    hitTransformGizmoRef,
    iconAGroupRef,
    iconBGroupRef,
    isDraggingRef,
    isInertiaActiveRef,
    keyLightRef,
    onZoomChangeRef,
    onDeselectLayersRef,
    onSelectLayerRef,
    pointerStartPositionRef,
    pivotGroupRef,
    previousPointerPositionRef,
    rendererRef,
    requestRenderRef,
    resetViewFrameRef,
    rimLightRef,
    rotationDragOverlayRef,
    rotationVelocityRef,
    sceneRef,
    selectionRaycasterRef,
    selectionPointerRef,
    setTransformGizmoHighlightRef,
    softboxLightRef,
    targetZoomRef,
    transformGizmoGroupRef,
    transformGizmoHitObjectsRef,
    viewInertiaEnabledRef,
  ])
}
