"use client"

import { useMemo } from "react"
import type { SvgCanvasProps } from "../3d/SvgCanvas"
import type { PlaybackClock } from "./PlaybackClock"
import type {
  PlaybackControlsProps,
  ViewOptionsPopoverProps,
} from "./ViewportControls"
import type { CanvasStudioProps } from "./ViewportStage"

type Handler<Key extends keyof SvgCanvasProps> = NonNullable<
  SvgCanvasProps[Key]
>

type UseViewportStagePropsArgs = {
  isPlaying: boolean
  clock: PlaybackClock
  duration: number
  wireframe: boolean
  lighting: Pick<
    SvgCanvasProps,
    "ambientColor" | "ambientIntensity" | "rimLightColor" | "rimLightIntensity"
  >
  zoom: number
  viewInertiaEnabled: boolean
  showCenterPoint: boolean
  showSelectionOutline: boolean
  showTransformGizmo: boolean
  selectedLayerId: string
  selectedIconColorRole?: "a" | "b"
  atTimelineStart: boolean
  atTimelineEnd: boolean
  hasPreviousKeyMoment: boolean
  hasNextKeyMoment: boolean
  zenMode: boolean
  animatedSeekEnabled: boolean
  onZoomChange: (zoom: number) => void
  onViewRotationCommit: Handler<"onViewRotationCommit">
  onViewRotationSet: Handler<"onViewRotationSet">
  onObjectScaleChange: (scale: number) => void
  onObjectScaleAxisChange: Handler<"onObjectScaleAxisChange">
  onMoveOffsetChange: Handler<"onMoveOffsetChange">
  onRotationAxisChange: Handler<"onRotationAxisChange">
  onSelectLayer: Handler<"onSelectLayer">
  onDeselectLayers: Handler<"onDeselectLayers">
  onModelReadyChange: (ready: boolean) => void
  onResetView: () => void
  onViewInertiaChange: (enabled: boolean) => void
  onShowCenterPointChange: (visible: boolean) => void
  onShowSelectionOutlineChange: (visible: boolean) => void
  onShowTransformGizmoChange: (visible: boolean) => void
  onAnimatedSeekChange: (enabled: boolean) => void
  onResetPlayback: () => void
  onPreviousKeyMoment: () => void
  onPlayToggle: () => void
  onNextKeyMoment: () => void
  onGoToEnd: () => void
  onExitZenMode: () => void
}

/**
 * Props for the preview: the canvas's studio settings (the document's frame is
 * evaluated inside the canvas itself), the view options menu and transport.
 * Memoized so the canvas only re-renders when one of them changes.
 */
export function useViewportStageProps({
  isPlaying,
  clock,
  duration,
  wireframe,
  lighting,
  zoom,
  viewInertiaEnabled,
  showCenterPoint,
  showSelectionOutline,
  showTransformGizmo,
  selectedLayerId,
  selectedIconColorRole,
  atTimelineStart,
  atTimelineEnd,
  hasPreviousKeyMoment,
  hasNextKeyMoment,
  zenMode,
  animatedSeekEnabled,
  onZoomChange,
  onViewRotationCommit,
  onViewRotationSet,
  onObjectScaleChange,
  onObjectScaleAxisChange,
  onMoveOffsetChange,
  onRotationAxisChange,
  onSelectLayer,
  onDeselectLayers,
  onModelReadyChange,
  onResetView,
  onViewInertiaChange,
  onShowCenterPointChange,
  onShowSelectionOutlineChange,
  onShowTransformGizmoChange,
  onAnimatedSeekChange,
  onResetPlayback,
  onPreviousKeyMoment,
  onPlayToggle,
  onNextKeyMoment,
  onGoToEnd,
  onExitZenMode,
}: UseViewportStagePropsArgs) {
  const { ambientColor, ambientIntensity, rimLightColor, rimLightIntensity } =
    lighting
  const canvasProps = useMemo<CanvasStudioProps>(
    () => ({
      wireframe,
      isPlaying,
      ambientColor,
      ambientIntensity,
      rimLightColor,
      rimLightIntensity,
      zoom,
      viewInertiaEnabled,
      showCenterPoint,
      showSelectionOutline,
      showTransformGizmo,
      selectedLayerId,
      selectedIconColorRole,
      onZoomChange,
      onViewRotationCommit,
      onViewRotationSet,
      onObjectScaleChange,
      onObjectScaleAxisChange,
      onMoveOffsetChange,
      onRotationAxisChange,
      onSelectLayer,
      onDeselectLayers,
      onModelReadyChange,
    }),
    [
      wireframe,
      isPlaying,
      ambientColor,
      ambientIntensity,
      rimLightColor,
      rimLightIntensity,
      zoom,
      viewInertiaEnabled,
      showCenterPoint,
      showSelectionOutline,
      showTransformGizmo,
      selectedLayerId,
      selectedIconColorRole,
      onZoomChange,
      onViewRotationCommit,
      onViewRotationSet,
      onObjectScaleChange,
      onObjectScaleAxisChange,
      onMoveOffsetChange,
      onRotationAxisChange,
      onSelectLayer,
      onDeselectLayers,
      onModelReadyChange,
    ]
  )

  const viewOptionsProps = useMemo<ViewOptionsPopoverProps>(
    () => ({
      viewInertiaEnabled,
      showCenterPoint,
      showSelectionOutline,
      showTransformGizmo,
      onResetView,
      onViewInertiaChange,
      onShowCenterPointChange,
      onShowSelectionOutlineChange,
      onShowTransformGizmoChange,
      animatedSeekEnabled,
      onAnimatedSeekChange,
    }),
    [
      viewInertiaEnabled,
      showCenterPoint,
      showSelectionOutline,
      showTransformGizmo,
      onResetView,
      onViewInertiaChange,
      onShowCenterPointChange,
      onShowSelectionOutlineChange,
      onShowTransformGizmoChange,
      animatedSeekEnabled,
      onAnimatedSeekChange,
    ]
  )

  const playbackProps = useMemo<PlaybackControlsProps>(
    () => ({
      zenMode,
      isPlaying,
      clock,
      duration,
      atTimelineStart,
      atTimelineEnd,
      hasPreviousKeyMoment,
      hasNextKeyMoment,
      onReset: onResetPlayback,
      onPreviousKeyMoment,
      onPlayToggle,
      onNextKeyMoment,
      onGoToEnd,
      onExitZenMode,
    }),
    [
      zenMode,
      isPlaying,
      clock,
      duration,
      atTimelineStart,
      atTimelineEnd,
      hasPreviousKeyMoment,
      hasNextKeyMoment,
      onResetPlayback,
      onPreviousKeyMoment,
      onPlayToggle,
      onNextKeyMoment,
      onGoToEnd,
      onExitZenMode,
    ]
  )

  return { canvasProps, viewOptionsProps, playbackProps }
}
