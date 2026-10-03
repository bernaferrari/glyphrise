"use client"

import { useRef, type MutableRefObject } from "react"
import * as THREE from "three"
import { useLatestRef } from "../../lib/use-latest-ref"
import type { SvgCanvasProps } from "./SvgTypes"
import type { RotationVelocity } from "./SvgPointerInteractionModel"

type Rotation = SvgCanvasProps["rotationOffset"]

type RotationDragOptions = {
  rotationOffset: Rotation
  cameraOrbitRef: MutableRefObject<Rotation>
  onCameraRotationSet: (rotation: Partial<Rotation>) => void
  onObjectRotationSet: SvgCanvasProps["onViewRotationSet"]
}

export function useSvgRotationDrag(options: RotationDragOptions) {
  const optionsRef = useLatestRef(options)
  const gestureRef = useRef({
    orbitCamera: false,
    rotation: options.rotationOffset,
  })

  const beginViewDrag = ({ altKey }: Pick<PointerEvent, "altKey">) => {
    gestureRef.current = {
      orbitCamera: altKey,
      rotation: { ...optionsRef.current.rotationOffset },
    }
  }

  const applyViewRotationDelta = (delta: RotationVelocity) => {
    const { cameraOrbitRef, onCameraRotationSet, onObjectRotationSet } =
      optionsRef.current
    const x = THREE.MathUtils.radToDeg(delta.x)
    const y = THREE.MathUtils.radToDeg(delta.y)
    if (gestureRef.current.orbitCamera) {
      const current = cameraOrbitRef.current
      onCameraRotationSet({ x: current.x + x, y: current.y + y })
      return
    }

    // Accumulate the gesture locally so events in the same React batch do not
    // repeatedly start from stale inspector props. Inertia uses this path too.
    const current = gestureRef.current.rotation
    const rotation = { x: current.x + x, y: current.y + y, z: current.z }
    gestureRef.current.rotation = rotation
    onObjectRotationSet?.(rotation)
  }

  return { beginViewDrag, applyViewRotationDelta }
}
