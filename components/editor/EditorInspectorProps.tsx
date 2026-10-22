"use client"

import type { RefObject } from "react"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import {
  EXTRUDE_DEFAULT,
  type EditorSnapshot,
  type MotionTrackId,
  ROTATION_COLOR,
  clampNumber,
  finiteNumber,
} from "./EditorModel"
import { findKeyframeAtTime } from "./EditorKeyframeModel"
import {
  isTransformKeyedAt,
  toggleScalarTrackKeyframe,
  toggleTransformKeyframes,
} from "./DocumentEditModel"
import type {
  InspectorSidebarProps,
  SidebarGeometryProps,
  SidebarLightProps,
  SidebarStyleProps,
  SidebarTransformProps,
} from "./InspectorSidebar"
import { InspectorKeyframeControl } from "./InspectorKeyframeControl"
import type { TimelineTrack } from "./TimelineModel"
import type { EditorAtTime } from "./EditorAtTime"
import type { useEditorBaseState } from "./useEditorBaseState"
import type { EditorRenderState } from "./useEditorRenderState"

type Editor = ReturnType<typeof useEditorBaseState>

export type InspectorTimeProps = Pick<
  InspectorSidebarProps,
  | "editScopeProps"
  | "styleProps"
  | "geometryProps"
  | "transformProps"
  | "lightProps"
>

type EditorInspectorPropsOptions = {
  store: EditorDocumentStore
  document: EditorSnapshot
  /** The editor at the time the inspector shows (the moving playhead while playing). */
  at: EditorAtTime
  render: EditorRenderState
  setCurrentTime: (time: number) => void
  stopPlayback: () => void
  canvas3DRef: RefObject<SvgCanvasRef | null>
  selection: Editor["selection"]
  transform: Editor["transform"]
  advancedMaterial: { open: boolean; setOpen: (open: boolean) => void }
  /** The timeline's add/remove for a property row, keyed by row id. */
  togglePropertyKeyframe: (rowId: string, keyframeId?: string | null) => void
}

/**
 * Everything the inspector shows and edits, built from the editor at one
 * moment. A plain function, so the inspector can rebuild it every playback
 * frame without re-rendering the rest of the editor. Every edit is a store
 * patch, so there are no per-property setters to pass around.
 */
export function buildEditorInspectorProps({
  store,
  document,
  at,
  render,
  setCurrentTime,
  stopPlayback,
  canvas3DRef,
  selection,
  transform,
  advancedMaterial,
  togglePropertyKeyframe,
}: EditorInspectorPropsOptions): InspectorTimeProps {
  const currentTime = at.time
  const { motion } = at
  const { duration } = document
  const { selectedMotionTrackId, setSelectedMotionTrackId, inspectorRefs } =
    selection
  const markCustom = () => store.set("activeRecipeId", null)
  const patchStyle = (patch: Partial<EditorSnapshot>) =>
    store.patch({ ...patch, activeRecipeId: null })

  const jumpToKeyframe = (time: number) => {
    stopPlayback()
    setCurrentTime(clampNumber(Number(time.toFixed(3)), 0, duration))
  }

  const trackValue = (track: TimelineTrack) =>
    track.id === "scale"
      ? at.activeObjectScale
      : track.id === "extrusion"
        ? at.activeExtrusionDepth
        : at.activeKeyLightIntensity

  const toggleTrackKeyframe = (track: TimelineTrack, value: number) => {
    setSelectedMotionTrackId(track.id as MotionTrackId)
    store.patch(
      toggleScalarTrackKeyframe(store.get(), track.id, value, currentTime)
    )
  }

  const trackKeyframeControl = (track: TimelineTrack, value: number) => (
    <InspectorKeyframeControl
      keyframes={track.keyframes}
      label={track.name.toLowerCase()}
      currentTime={currentTime}
      duration={duration}
      isKeyedHere={Boolean(findKeyframeAtTime(track.keyframes, currentTime))}
      color={track.color}
      onToggle={() => toggleTrackKeyframe(track, value)}
      onJump={jumpToKeyframe}
    />
  )

  const { extrusionTrack, scaleTrack, lightingTrack } = render.scalarTracks

  const styleProps: SidebarStyleProps = {
    fillRef: inspectorRefs.fill,
    materialRef: inspectorRefs.material,
    materialPreset: document.materialPreset,
    materialKeyframeCount: document.materialKeyframes.length,
    activeMaterialSettings: at.activeMaterialSettings,
    isAdvancedMaterialOpen: advancedMaterial.open,
    selectedShapeFill: at.selectedShapeFill,
    selectedShapeFillSecondary: at.selectedShapeFillSecondary,
    selectedShapeGradientType: at.selectedShapeGradientType,
    selectedShapeFillStops: at.selectedShapeFillStops,
    fillMode: document.fillMode,
    onFillColorChange: at.fill.updateFillColor,
    onGradientToggle: at.fill.setGradientEnabled,
    onGradientTypeChange: at.fill.updateGradientType,
    onStopsChange: at.fill.updateFillStops,
    onMaterialPresetChange: at.material.applyMaterialPreset,
    onAdvancedMaterialOpenChange: advancedMaterial.setOpen,
    onMaterialSettingChange: at.material.updateMaterialSetting,
  }

  const geometryProps: SidebarGeometryProps = {
    extrusionRef: inspectorRefs.extrusion,
    isActive: selectedMotionTrackId === "extrusion",
    extrusionTrack,
    activeExtrusionDepth: at.activeExtrusionDepth,
    extrusionDepth: document.extrusionDepth,
    activeGeometryQuality: at.activeGeometryQuality,
    bevelEnabled: document.bevelEnabled,
    bevelThickness: document.bevelThickness,
    bevelSize: document.bevelSize,
    bevelSegments: document.bevelSegments,
    keyframeControl: trackKeyframeControl(
      extrusionTrack,
      finiteNumber(
        extrusionTrack.keyframes.length > 0
          ? at.activeExtrusionDepth
          : document.extrusionDepth,
        EXTRUDE_DEFAULT
      )
    ),
    onActivate: () => setSelectedMotionTrackId("extrusion"),
    onDepthChange: motion.handleDepthChange,
    onBevelEnabledChange: (bevelEnabled) => patchStyle({ bevelEnabled }),
    onBevelThicknessChange: (bevelThickness) => patchStyle({ bevelThickness }),
    onBevelSizeChange: (bevelSize) => patchStyle({ bevelSize }),
    onBevelSegmentsChange: (bevelSegments) => patchStyle({ bevelSegments }),
    onQualityChange: motion.updateQuality,
    onCustomEdit: markCustom,
  }

  const transformValues = {
    scale: at.activeObjectScale,
    rotation: at.activeRotationOffset,
    move: at.activeMoveOffset,
  }
  const transformProps: SidebarTransformProps = {
    scaleRef: inspectorRefs.scale,
    rotationRef: inspectorRefs.rotation,
    moveRef: inspectorRefs.move,
    activeTrackId: selectedMotionTrackId,
    scaleTrack,
    activeObjectScale: at.activeObjectScale,
    objectScale: document.objectScale,
    objectScaleAxes: document.objectScaleAxes,
    isScaleLocked: transform.isScaleLocked,
    rotationOffset: at.activeRotationOffset,
    rotationAxisKeyframes: document.rotationAxisKeyframes,
    moveKeyframesLength: document.moveKeyframes.length,
    activeMoveOffset: at.activeMoveOffset,
    selectedShapeLayers: render.selectedShapeLayers,
    selectedLayerId: render.selectedLayerId,
    selectedLayerOverride: render.selectedLayerOverride,
    hiddenLayerIds: render.hiddenLayerIds,
    shapeNavigation: render.shapeNavigation,
    transformKeyframeControl: (
      <InspectorKeyframeControl
        keyframes={[
          ...scaleTrack.keyframes,
          ...document.rotationAxisKeyframes,
          ...document.moveKeyframes,
        ]}
        label="transform"
        currentTime={currentTime}
        duration={duration}
        isKeyedHere={isTransformKeyedAt(document, currentTime)}
        color={ROTATION_COLOR}
        onToggle={() =>
          store.patch(
            toggleTransformKeyframes(store.get(), currentTime, transformValues)
          )
        }
        onJump={jumpToKeyframe}
      />
    ),
    onActivateTrack: setSelectedMotionTrackId,
    onScaleLockChange: transform.setIsScaleLocked,
    onScaleChange: motion.handleScaleChange,
    onScaleAxisChange: motion.handleScaleAxisChange,
    onRotationAxisChange: motion.handleRotationAxisChange,
    onMoveAxisChange: motion.updateMoveAxis,
    onSelectLayer: render.setSelectedLayerId,
    onToggleLayerVisibility: render.toggleSelectedLayerVisibility,
    onLayerScaleChange: render.updateSelectedLayerScale,
    onLayerDepthChange: render.updateSelectedLayerDepth,
    onCustomEdit: markCustom,
  }

  const lightProps: SidebarLightProps = {
    lightingRef: inspectorRefs.lighting,
    isActive: selectedMotionTrackId === "lighting",
    lightingTrack,
    activeKeyLightIntensity: at.activeKeyLightIntensity,
    keyLightIntensity: document.keyLightIntensity,
    activeKeyLightPosition: at.activeKeyLightPosition,
    keyLightColor: document.keyLightColor,
    keyLightSoftness: document.keyLightSoftness,
    lightPositionIsKeyed: at.lightPositionIsKeyed,
    lightPositionKeyframeControl: (
      <InspectorKeyframeControl
        keyframes={document.keyLightPositionKeyframes}
        label="light position"
        currentTime={currentTime}
        duration={duration}
        isKeyedHere={at.lightPositionIsKeyed}
        color="#ff5b9a"
        onToggle={at.light.toggleLightPositionKeyframeAtPlayhead}
        onJump={jumpToKeyframe}
      />
    ),
    brightnessKeyframeControl: trackKeyframeControl(
      lightingTrack,
      finiteNumber(
        lightingTrack.keyframes.length > 0
          ? at.activeKeyLightIntensity
          : document.keyLightIntensity,
        1
      )
    ),
    onActivate: () => setSelectedMotionTrackId("lighting"),
    onLightPositionChange: at.light.updateLightPositionXY,
    onLightColorChange: (keyLightColor) => patchStyle({ keyLightColor }),
    onLightSoftnessChange: (keyLightSoftness) =>
      patchStyle({ keyLightSoftness }),
    onToggleLightPositionKeyframe:
      at.light.toggleLightPositionKeyframeAtPlayhead,
    onBrightnessChange: motion.handleBrightnessChange,
    onCustomEdit: markCustom,
  }

  // Each property's ◇ and "edits update this keyframe" label in the inspector.
  const togglePropertyRow = (
    rowId: string,
    keyframes: Array<{ id: string; time: number }>
  ) => {
    stopPlayback()
    togglePropertyKeyframe(
      rowId,
      findKeyframeAtTime(keyframes, currentTime)?.id
    )
  }
  const toggleTrack = (track: TimelineTrack) => {
    stopPlayback()
    store.patch(
      toggleScalarTrackKeyframe(
        store.get(),
        track.id,
        trackValue(track),
        currentTime
      )
    )
  }
  const editScopeProps: InspectorSidebarProps["editScopeProps"] = {
    currentTime,
    properties: [
      {
        name: "Rotation",
        times: document.rotationAxisKeyframes.map((k) => k.time),
        onToggle: () => {
          canvas3DRef.current?.commitRotationEdit()
          togglePropertyRow("rotation", document.rotationAxisKeyframes)
        },
      },
      {
        name: "Position",
        times: document.moveKeyframes.map((k) => k.time),
        onToggle: () => togglePropertyRow("move", document.moveKeyframes),
      },
      {
        name: "Fill",
        times: document.fillKeyframes.map((k) => k.time),
        onToggle: () => togglePropertyRow("fill", document.fillKeyframes),
      },
      {
        name: "Finish",
        times: document.materialKeyframes.map((k) => k.time),
        onToggle: () =>
          togglePropertyRow("material", document.materialKeyframes),
      },
      {
        // Curve smoothness is keyed with Depth (see linkQualityKeyframes).
        name: "Quality",
        times: document.qualityKeyframes.map((k) => k.time),
        onToggle: () => toggleTrack(extrusionTrack),
      },
      {
        name: "Light direction",
        times: document.keyLightPositionKeyframes.map((k) => k.time),
        onToggle: () => {
          stopPlayback()
          at.light.toggleLightPositionKeyframeAtPlayhead()
        },
      },
      ...document.tracks
        .filter((track) => track.id !== "rotation" && track.id !== "transition")
        .map((track) => ({
          name: track.name,
          times: track.keyframes.map((k) => k.time),
          onToggle: () => toggleTrack(track),
        })),
    ],
  }

  return {
    editScopeProps,
    styleProps,
    geometryProps,
    transformProps,
    lightProps,
  }
}
