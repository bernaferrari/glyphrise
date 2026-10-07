import type React from "react"
import type { Vector3Value } from "./SvgTypes"
import type { SvgCanvasLiveRenderProps } from "./useSvgCanvasLiveRefs"

export type SvgResetTransform = Pick<
  SvgCanvasLiveRenderProps,
  "rotationOffset" | "moveOffset" | "objectScale" | "objectScaleAxes"
>

const towards = (
  from: Vector3Value,
  target: number,
  progress: number
): Vector3Value => ({
  x: from.x + (target - from.x) * progress,
  y: from.y + (target - from.y) * progress,
  z: from.z + (target - from.z) * progress,
})

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

export const animateSvgViewReset = ({
  resetViewFrameRef,
  viewNudgeFrameRef,
  isInertiaActiveRef,
  rotationVelocityRef,
  currentZoomRef,
  targetZoomRef,
  animationStartRef,
  onZoomChange,
  requestRender,
  artworkTransform,
  resetArtwork = true,
  onArtworkTransform,
}: {
  resetViewFrameRef: React.MutableRefObject<number | null>
  viewNudgeFrameRef: React.MutableRefObject<number | null>
  isInertiaActiveRef: React.MutableRefObject<boolean>
  rotationVelocityRef: React.MutableRefObject<{ x: number; y: number }>
  currentZoomRef: React.MutableRefObject<number>
  targetZoomRef: React.MutableRefObject<number>
  animationStartRef: React.MutableRefObject<number>
  onZoomChange?: (zoom: number) => void
  requestRender: () => void
  artworkTransform: SvgResetTransform
  resetArtwork?: boolean
  onArtworkTransform: (transform: SvgResetTransform | null) => void
}) => {
  if (resetViewFrameRef.current !== null) {
    cancelAnimationFrame(resetViewFrameRef.current)
    resetViewFrameRef.current = null
  }
  if (viewNudgeFrameRef.current !== null) {
    cancelAnimationFrame(viewNudgeFrameRef.current)
    viewNudgeFrameRef.current = null
  }

  isInertiaActiveRef.current = false
  rotationVelocityRef.current = { x: 0, y: 0 }

  const startZoom = currentZoomRef.current
  const startArtwork: SvgResetTransform = {
    rotationOffset: { ...artworkTransform.rotationOffset },
    moveOffset: { ...artworkTransform.moveOffset },
    objectScale: artworkTransform.objectScale,
    objectScaleAxes: { ...artworkTransform.objectScaleAxes },
  }
  // The document commits the reset once; preserve the displayed pose while
  // the tween brings every artwork transform to its target.
  onArtworkTransform(resetArtwork ? startArtwork : null)
  const duration = 220
  const startTime = performance.now()

  targetZoomRef.current = 1.0
  animationStartRef.current = performance.now()
  onZoomChange?.(1.0)

  const tick = (now: number) => {
    const t = Math.max(0, Math.min(1, (now - startTime) / duration))
    const eased = easeOutCubic(t)

    currentZoomRef.current = startZoom + (1 - startZoom) * eased
    onArtworkTransform(
      !resetArtwork || t === 1
        ? null
        : {
            rotationOffset: towards(startArtwork.rotationOffset, 0, eased),
            moveOffset: towards(startArtwork.moveOffset, 0, eased),
            objectScale:
              startArtwork.objectScale + (1 - startArtwork.objectScale) * eased,
            objectScaleAxes: towards(startArtwork.objectScaleAxes, 1, eased),
          }
    )
    requestRender()

    if (t < 1) {
      resetViewFrameRef.current = requestAnimationFrame(tick)
      return
    }

    resetViewFrameRef.current = null
    currentZoomRef.current = 1.0
  }

  resetViewFrameRef.current = requestAnimationFrame(tick)
}
