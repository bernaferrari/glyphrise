"use client"

import React from "react"
import {
  LightPosition,
  MotionTrackId,
  ROTATION_COLOR,
  Vector3Keyframe,
  clampNumber,
  createEditorId,
} from "./EditorModel"
import {
  findKeyframeAtTime,
  removeKeyframesAtTime,
  toggleScalarTrackKeyframeAtTime,
  upsertVectorKeyframeAtTime,
} from "./EditorKeyframeModel"
import { InspectorKeyframeControl } from "./InspectorKeyframeControl"
import type { TimelineTrack } from "./TimelineModel"

export function useInspectorKeyframeControls({
  currentTime,
  duration,
  setTracks,
  setSelectedMotionTrackId,
  setActiveRecipeId,
  scaleTrack,
  activeObjectScale,
  activeRotationOffset,
  rotationAxisKeyframes,
  setRotationAxisKeyframes,
  activeMoveOffset,
  moveKeyframes,
  setMoveKeyframes,
  keyLightPositionKeyframes,
  lightPositionKeyframeAtPlayhead,
  toggleLightPositionKeyframeAtPlayhead,
  stopPlayback,
  setCurrentTime,
}: {
  currentTime: number
  duration: number
  setTracks: React.Dispatch<React.SetStateAction<TimelineTrack[]>>
  setSelectedMotionTrackId: React.Dispatch<React.SetStateAction<MotionTrackId>>
  setActiveRecipeId: React.Dispatch<React.SetStateAction<string | null>>
  scaleTrack: TimelineTrack
  activeObjectScale: number
  activeRotationOffset: LightPosition
  rotationAxisKeyframes: Vector3Keyframe[]
  setRotationAxisKeyframes: React.Dispatch<
    React.SetStateAction<Vector3Keyframe[]>
  >
  activeMoveOffset: LightPosition
  moveKeyframes: Vector3Keyframe[]
  setMoveKeyframes: React.Dispatch<React.SetStateAction<Vector3Keyframe[]>>
  keyLightPositionKeyframes: Vector3Keyframe[]
  lightPositionKeyframeAtPlayhead: () => Vector3Keyframe | undefined
  toggleLightPositionKeyframeAtPlayhead: () => void
  stopPlayback: () => void
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>
}) {
  const keyframeAtPlayhead = (track: TimelineTrack) =>
    findKeyframeAtTime(track.keyframes, currentTime)

  const jumpToPropertyKeyframe = (time: number) => {
    stopPlayback()
    setCurrentTime(clampNumber(Number(time.toFixed(3)), 0, duration))
  }

  const toggleKeyframeAtPlayhead = (track: TimelineTrack, value: number) => {
    setSelectedMotionTrackId(track.id as MotionTrackId)
    setActiveRecipeId(null)
    setTracks((prevTracks) =>
      toggleScalarTrackKeyframeAtTime({
        tracks: prevTracks,
        trackId: track.id,
        value,
        time: currentTime,
        duration,
      })
    )
  }

  const moveKeyframeAtPlayhead = () =>
    findKeyframeAtTime(moveKeyframes, currentTime)

  const renderLightPositionKeyframeControl = () => (
    <InspectorKeyframeControl
      keyframes={keyLightPositionKeyframes}
      label="light position"
      currentTime={currentTime}
      duration={duration}
      isKeyedHere={Boolean(lightPositionKeyframeAtPlayhead())}
      color="#ff5b9a"
      onToggle={toggleLightPositionKeyframeAtPlayhead}
      onJump={jumpToPropertyKeyframe}
    />
  )

  const renderKeyframeControl = (track: TimelineTrack, value: number) => (
    <InspectorKeyframeControl
      keyframes={track.keyframes}
      label={track.name.toLowerCase()}
      currentTime={currentTime}
      duration={duration}
      isKeyedHere={Boolean(keyframeAtPlayhead(track))}
      color={track.color}
      onToggle={() => toggleKeyframeAtPlayhead(track, value)}
      onJump={jumpToPropertyKeyframe}
    />
  )

  const isTransformKeyedAtPlayhead = () =>
    Boolean(
      keyframeAtPlayhead(scaleTrack) ||
      findKeyframeAtTime(rotationAxisKeyframes, currentTime) ||
      moveKeyframeAtPlayhead()
    )

  const toggleTransformKeyframeAtPlayhead = () => {
    setActiveRecipeId(null)
    const removeAtPlayhead = isTransformKeyedAtPlayhead()
    setTracks((prevTracks) =>
      prevTracks.map((track) =>
        track.id === "scale"
          ? {
              ...track,
              keyframes: removeAtPlayhead
                ? removeKeyframesAtTime(track.keyframes, currentTime)
                : [
                    ...track.keyframes,
                    {
                      id: createEditorId(track.id),
                      time: currentTime,
                      value: activeObjectScale,
                      easing: "ease-in-out" as const,
                    },
                  ].sort((a, b) => a.time - b.time),
            }
          : track
      )
    )
    setRotationAxisKeyframes((keyframes) => {
      if (removeAtPlayhead) return removeKeyframesAtTime(keyframes, currentTime)
      return upsertVectorKeyframeAtTime({
        keyframes,
        idPrefix: "rotation",
        value: activeRotationOffset,
        time: currentTime,
        duration,
        createIfMissing: true,
      })
    })
    setMoveKeyframes((keyframes) => {
      if (removeAtPlayhead) return removeKeyframesAtTime(keyframes, currentTime)
      return upsertVectorKeyframeAtTime({
        keyframes,
        idPrefix: "move",
        value: activeMoveOffset,
        time: currentTime,
        duration,
        createIfMissing: true,
      })
    })
  }

  const transformKeyframes = [
    ...scaleTrack.keyframes,
    ...rotationAxisKeyframes,
    ...moveKeyframes,
  ]
  const renderTransformKeyframeControl = () => (
    <InspectorKeyframeControl
      keyframes={transformKeyframes}
      label="transform"
      currentTime={currentTime}
      duration={duration}
      isKeyedHere={isTransformKeyedAtPlayhead()}
      color={ROTATION_COLOR}
      onToggle={toggleTransformKeyframeAtPlayhead}
      onJump={jumpToPropertyKeyframe}
    />
  )

  return {
    renderKeyframeControl,
    renderLightPositionKeyframeControl,
    renderTransformKeyframeControl,
    keyframeAtPlayhead,
  }
}
