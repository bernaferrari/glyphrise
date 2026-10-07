"use client"

import { useCallback } from "react"
import { SCALE_DEFAULT } from "./EditorModel"
import type { MotionPropertyControlsOptions } from "./MotionPropertyControlsModel"
import { useMoveMotionControls } from "./useMoveMotionControls"
import { useQualityMotionControls } from "./useQualityMotionControls"
import { useRotationMotionControls } from "./useRotationMotionControls"
import { useScalarMotionTrackControls } from "./useScalarMotionTrackControls"

export function useMotionPropertyControls({
  currentTime,
  isPlaying,
  duration,
  autoKeyEnabled,
  tracks,
  setTracks,
  setSelectedMotionTrackId,
  setActiveRecipeId,
  setExtrusionDepth,
  setRotationOffset,
  activeRotationOffset,
  setRotationAxisKeyframes,
  setPreviewRotationOffset,
  setObjectScale,
  activeObjectScale,
  objectScaleAxes,
  setObjectScaleAxes,
  setIsScaleLocked,
  activeMoveOffset,
  setMoveOffset,
  setMoveKeyframes,
  setKeyLightIntensity,
  setGeometryQuality,
  setQualityKeyframes,
  canvas3DRef,
}: MotionPropertyControlsOptions) {
  const markCustom = useCallback(
    () => setActiveRecipeId(null),
    [setActiveRecipeId]
  )

  const {
    handleDepthChange,
    handleScaleChange,
    handleScaleAxisChange,
    handleBrightnessChange,
  } = useScalarMotionTrackControls({
    currentTime,
    duration,
    tracks,
    setTracks,
    setSelectedMotionTrackId,
    setExtrusionDepth,
    setObjectScale,
    setObjectScaleAxes,
    setIsScaleLocked,
    setKeyLightIntensity,
    autoKeyEnabled,
    markCustom,
  })

  const {
    handleRotationAxisChange,
    handleViewRotationCommit,
    handleViewRotationSet,
  } = useRotationMotionControls({
    currentTime,
    duration,
    setSelectedMotionTrackId,
    setRotationOffset,
    activeRotationOffset,
    setRotationAxisKeyframes,
    setPreviewRotationOffset,
    autoKeyEnabled,
    markCustom,
  })

  const { updateMoveAxis, resetMovePositionToOrigin } = useMoveMotionControls({
    currentTime,
    duration,
    setSelectedMotionTrackId,
    activeMoveOffset,
    setMoveOffset,
    setMoveKeyframes,
    autoKeyEnabled,
    markCustom,
  })

  const { updateQuality } = useQualityMotionControls({
    currentTime,
    duration,
    autoKeyEnabled,
    setGeometryQuality,
    setQualityKeyframes,
    markCustom,
  })

  const resetView = useCallback(() => {
    canvas3DRef.current?.resetRotation()
    // The sampled playback pose is not an authored edit.
    if (isPlaying) return
    if (Object.values(activeRotationOffset).some((value) => value !== 0)) {
      handleViewRotationSet({ x: 0, y: 0, z: 0 })
    }
    if (Object.values(activeMoveOffset).some((value) => value !== 0)) {
      resetMovePositionToOrigin()
    }
    if (activeObjectScale !== SCALE_DEFAULT) {
      handleScaleChange(SCALE_DEFAULT)
    }
    if (
      Object.values(objectScaleAxes).some((value) => value !== SCALE_DEFAULT)
    ) {
      markCustom()
      setObjectScaleAxes({
        x: SCALE_DEFAULT,
        y: SCALE_DEFAULT,
        z: SCALE_DEFAULT,
      })
    }
  }, [
    canvas3DRef,
    isPlaying,
    activeRotationOffset,
    activeMoveOffset,
    activeObjectScale,
    objectScaleAxes,
    handleViewRotationSet,
    resetMovePositionToOrigin,
    handleScaleChange,
    markCustom,
    setObjectScaleAxes,
  ])

  return {
    handleDepthChange,
    handleRotationAxisChange,
    handleScaleChange,
    handleScaleAxisChange,
    handleViewRotationCommit,
    handleViewRotationSet,
    handleBrightnessChange,
    updateMoveAxis,
    updateQuality,
    resetView,
  }
}
