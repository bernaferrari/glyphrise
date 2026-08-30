import * as THREE from "three"
import type { MutableRefObject } from "react"
import type { TransformAxis, TransformGizmoHandle } from "./TransformGizmo"
import {
  hasViewDragExceededThreshold,
  nextWheelZoom,
  shouldStartViewInertia,
  viewRotationVelocityFromPointerDelta,
  type RotationVelocity,
} from "./SvgPointerInteractionModel"
import {
  isPrimaryButtonReleased,
  safelyReleasePointerCapture,
  safelySetPointerCapture,
} from "@/lib/drag-events"
import { axisDragCursor } from "./TransformGizmoInteractionModel"
import { ALL_LAYERS_ID } from "../editor/SvgLayerOverrideModel"

type PointerPosition = { x: number; y: number }

export type SvgCanvasPointerBindings = {
  canvas: HTMLCanvasElement
  hitTransformGizmo: (event: PointerEvent) => TransformGizmoHandle | null
  beginTransformScale: (event: PointerEvent, axis?: TransformAxis) => void
  beginTransformMove: (axis: TransformAxis, event: PointerEvent) => void
  beginTransformRotate: (axis: TransformAxis, event: PointerEvent) => void
  setTransformGizmoHighlight: (
    hovered: TransformGizmoHandle | null,
    active?: TransformGizmoHandle | null
  ) => void
  applyViewRotationDelta: (delta: RotationVelocity) => void
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
  onZoomChange?: (zoom: number) => void
  animationStartRef: MutableRefObject<number>
  iconAGroupRef: MutableRefObject<THREE.Group | null>
  iconBGroupRef: MutableRefObject<THREE.Group | null>
  sceneRef: MutableRefObject<THREE.Scene | null>
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>
  selectionRaycasterRef: MutableRefObject<THREE.Raycaster>
  selectionPointerRef: MutableRefObject<THREE.Vector2>
  onSelectLayer?: (layerId: string) => void
  onDeselectLayers?: () => void
  /**
   * Resolves the color role ("a" | "b") of the currently selected shape.
   * When provided, selection clicks only resolve against layers of that
   * icon, ignoring hits on the other icon's meshes.
   */
  selectedIconColorRole?: () => "a" | "b" | undefined
  requestRender: () => void
}

export const bindSvgCanvasPointerInteractions = ({
  canvas,
  hitTransformGizmo,
  beginTransformScale,
  beginTransformMove,
  beginTransformRotate,
  setTransformGizmoHighlight,
  applyViewRotationDelta,
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
  animationStartRef,
  iconAGroupRef,
  iconBGroupRef,
  sceneRef,
  cameraRef,
  selectionRaycasterRef,
  onSelectLayer,
  selectionPointerRef,
  onZoomChange,
  selectedIconColorRole,
  onDeselectLayers,
  requestRender,
}: SvgCanvasPointerBindings) => {
  const setHoverSelectable = (selectable: boolean) => {
    canvas.style.cursor = selectable ? "pointer" : ""
  }
  const handlePointerDown = (event: PointerEvent) => {
    requestRender()
    if (event.button !== 0) return
    const transformHandle = hitTransformGizmo(event)
    if (transformHandle) {
      if (transformHandle.kind === "scale") {
        beginTransformScale(event, transformHandle.axis)
        return
      }
      if (transformHandle.kind === "move" && transformHandle.axis) {
        beginTransformMove(transformHandle.axis, event)
        return
      }
      if (transformHandle.kind === "rotate" && transformHandle.axis) {
        beginTransformRotate(transformHandle.axis, event)
        return
      }
    }

    isDraggingRef.current = true
    hasViewDragMovedRef.current = false
    activePointerIdRef.current = event.pointerId
    pointerStartPositionRef.current = { x: event.clientX, y: event.clientY }
    previousPointerPositionRef.current = { x: event.clientX, y: event.clientY }
    safelySetPointerCapture(canvas, event.pointerId)
  }

  const endViewDrag = (event: PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId) return
    isDraggingRef.current = false
    activePointerIdRef.current = null
    if (!hasViewDragMovedRef.current) {
      safelyReleasePointerCapture(canvas, event.pointerId)
      return
    }

    hasViewDragMovedRef.current = false
    if (
      viewInertiaEnabledRef.current &&
      shouldStartViewInertia(rotationVelocityRef.current)
    ) {
      isInertiaActiveRef.current = true
    } else {
      isInertiaActiveRef.current = false
      rotationVelocityRef.current = { x: 0, y: 0 }
    }
    safelyReleasePointerCapture(canvas, event.pointerId)
  }

  const handlePointerUp = (event: PointerEvent) => {
    requestRender()
    const wasViewDrag = activePointerIdRef.current === event.pointerId
    // endViewDrag resets hasViewDragMovedRef.current, so the sub-threshold
    // "this release was a click" decision must be snapshotted first.
    const wasClick = wasViewDrag && !hasViewDragMovedRef.current
    endViewDrag(event)
    if (wasClick) handleSelectClick(event)
  }

  const handleSelectClick = (event: PointerEvent) => {
    if (!onSelectLayer) return
    const camera = cameraRef.current
    const scene = sceneRef.current
    if (!camera || !scene) return

    const rect = canvas.getBoundingClientRect()
    selectionPointerRef.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    )
    selectionRaycasterRef.current.setFromCamera(
      selectionPointerRef.current,
      camera
    )
    const intersections = selectionRaycasterRef.current.intersectObjects(
      [iconAGroupRef, iconBGroupRef]
        .map((groupRef) => groupRef.current)
        .filter((group): group is THREE.Group => group !== null),
      true
    )
    if (intersections.length === 0) {
      onDeselectLayers?.()
      return
    }
    const selectedColorRole = selectedIconColorRole?.()
    for (const intersection of intersections) {
      const { userData } = intersection.object as THREE.Mesh
      if (selectedColorRole && userData.iconColorRole !== selectedColorRole) {
        continue
      }
      const cutSourceLayerIds = userData.cutSourceLayerIds as
        | string[]
        | undefined
      if (Array.isArray(cutSourceLayerIds)) {
        // The welded cut body has no single layer id: a hit stands for all
        // contributing layers, so reset to the "All paths" chip.
        onSelectLayer(
          cutSourceLayerIds.length === 1 ? cutSourceLayerIds[0] : ALL_LAYERS_ID
        )
        return
      }
      const pathLayerId = userData.pathLayerId
      if (typeof pathLayerId === "string") {
        onSelectLayer(pathLayerId)
        return
      }
    }
  }
  const raycastSelectableAt = (event: PointerEvent) => {
    const camera = cameraRef.current
    const scene = sceneRef.current
    if (!camera || !scene) return false
    const rect = canvas.getBoundingClientRect()
    selectionPointerRef.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    )
    selectionRaycasterRef.current.setFromCamera(
      selectionPointerRef.current,
      camera
    )
    const intersections = selectionRaycasterRef.current.intersectObjects(
      [iconAGroupRef, iconBGroupRef]
        .map((groupRef) => groupRef.current)
        .filter((group): group is THREE.Group => group !== null),
      true
    )
    const selectedColorRole = selectedIconColorRole?.()
    return intersections.some((intersection) => {
      const { userData } = intersection.object as THREE.Mesh
      if (selectedColorRole && userData.iconColorRole !== selectedColorRole) {
        return false
      }
      return (
        Array.isArray(userData.cutSourceLayerIds) ||
        typeof userData.pathLayerId === "string"
      )
    })
  }

  const handlePointerMove = (event: PointerEvent) => {
    requestRender()
    if (!isDraggingRef.current) {
      const transformHandle = hitTransformGizmo(event)
      setTransformGizmoHighlight(transformHandle)
      if (transformHandle) {
        canvas.style.cursor = transformHandle.axis
          ? axisDragCursor(transformHandle.axis)
          : "move"
        return
      }
      canvas.style.cursor = ""
      setHoverSelectable(raycastSelectableAt(event))
      return
    }
    if (activePointerIdRef.current !== event.pointerId) return
    if (isPrimaryButtonReleased(event)) {
      endViewDrag(event)
      return
    }

    const currentPointer = { x: event.clientX, y: event.clientY }
    if (!hasViewDragMovedRef.current) {
      if (
        !hasViewDragExceededThreshold(
          pointerStartPositionRef.current,
          currentPointer
        )
      )
        return
      hasViewDragMovedRef.current = true
      isInertiaActiveRef.current = false
      rotationVelocityRef.current = { x: 0, y: 0 }
      previousPointerPositionRef.current = currentPointer
      return
    }

    const velocity = viewRotationVelocityFromPointerDelta(
      previousPointerPositionRef.current,
      currentPointer
    )

    rotationVelocityRef.current = velocity
    applyViewRotationDelta(velocity)
    previousPointerPositionRef.current = currentPointer
  }

  const handlePointerCancel = (event: PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId) return
    isDraggingRef.current = false
    hasViewDragMovedRef.current = false
    activePointerIdRef.current = null
    isInertiaActiveRef.current = false
    rotationVelocityRef.current = { x: 0, y: 0 }
    safelyReleasePointerCapture(canvas, event.pointerId)
  }

  const handlePointerLeave = () => {
    if (!isDraggingRef.current) {
      setTransformGizmoHighlight(null)
      setHoverSelectable(false)
    }
  }

  const handleWheel = (event: WheelEvent) => {
    requestRender()
    event.preventDefault()
    if (!onZoomChange) return
    const newZoom = nextWheelZoom(targetZoomRef.current, event.deltaY)
    targetZoomRef.current = newZoom
    onZoomChange(Number(newZoom.toFixed(2)))
  }

  const handleDoubleClick = () => {
    targetZoomRef.current = 1
    currentZoomRef.current = 1
    animationStartRef.current = performance.now()
    iconAGroupRef.current?.rotation.set(0, 0, 0)
    iconBGroupRef.current?.rotation.set(0, 0, 0)
    onZoomChange?.(1)
  }

  canvas.addEventListener("pointerdown", handlePointerDown)
  canvas.addEventListener("pointermove", handlePointerMove)
  canvas.addEventListener("pointerup", handlePointerUp)
  canvas.addEventListener("pointercancel", handlePointerCancel)
  canvas.addEventListener("pointerleave", handlePointerLeave)
  canvas.addEventListener("wheel", handleWheel, { passive: false })
  canvas.addEventListener("dblclick", handleDoubleClick)

  return () => {
    canvas.removeEventListener("pointerdown", handlePointerDown)
    canvas.removeEventListener("pointermove", handlePointerMove)
    canvas.removeEventListener("pointerup", handlePointerUp)
    canvas.removeEventListener("pointercancel", handlePointerCancel)
    canvas.removeEventListener("pointerleave", handlePointerLeave)
    canvas.removeEventListener("wheel", handleWheel)
    canvas.removeEventListener("dblclick", handleDoubleClick)
  }
}
