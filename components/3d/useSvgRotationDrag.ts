"use client"

import type { MutableRefObject } from "react"
import * as THREE from "three"
import { useLatestRef } from "../../lib/use-latest-ref"
import type { SvgCanvasProps } from "./SvgTypes"
import type { RotationVelocity } from "./SvgPointerInteractionModel"

type Rotation = SvgCanvasProps["rotationOffset"]
type RotationDragOptions = {
  cameraOrbitRef: MutableRefObject<Rotation>
  onCameraRotationSet: (rotation: Partial<Rotation>) => void
}

export function useSvgRotationDrag(options: RotationDragOptions) {
  const optionsRef = useLatestRef(options)
  const applyViewRotationDelta = (delta: RotationVelocity) => {
    const { cameraOrbitRef, onCameraRotationSet } = optionsRef.current
    const current = cameraOrbitRef.current
    onCameraRotationSet({
      x: current.x + THREE.MathUtils.radToDeg(delta.x),
      y: current.y + THREE.MathUtils.radToDeg(delta.y),
    })
  }
  return { applyViewRotationDelta }
}
