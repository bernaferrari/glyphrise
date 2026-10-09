"use client"

import { useEffect, useState } from "react"

import { useEditorBaseState } from "./useEditorBaseState"
import { useEditorDocumentLifecycle } from "./useEditorDocumentLifecycle"
import { useEditorTimelineSurface } from "./useEditorTimelineSurface"
import { useTimelineStepShortcuts } from "./useEditorShortcuts"
import { TIMELINE_FRAME_RATE } from "./timeline/TimelineGeometry"
import { useEditorViewportSurface } from "./useEditorViewportSurface"
import { useEditorExportSurface } from "./useEditorExportSurface"
import { useEditorInspectorSurface } from "./useEditorInspectorSurface"
import { useEditorRenderState } from "./useEditorRenderState"
import { useEditorMotionSurface } from "./useEditorMotionSurface"
import { MOTION_RECIPES, type MotionRecipe } from "./MotionRecipes"
import { ALL_LAYERS_ID } from "./SvgLayerModel"
import type { AppLayoutViewProps } from "./AppLayoutView"
import { clampTimelineDuration } from "./TimelineDurationModel"
import { createAnimationPreset } from "./AnimationPresetModel"
import { evaluateExportFrame } from "./ExportFrameModel"
import { useKeyframeNotice } from "./useKeyframeNotice"
import { useCreationJourney } from "./useCreationJourney"
import {
  addKeyframeAtTime,
  findKeyframeAtTime,
  normalizedPlayheadTime,
  removeKeyframesAtTime,
  toggleScalarTrackKeyframeAtTime,
} from "./EditorKeyframeModel"
import { createEditorId } from "./EditorModel"

export function useAppLayoutController(): AppLayoutViewProps {
  const editor = useEditorBaseState()
  const {
    documentSnapshot,
    projectFiles: {
      newProject,
      openProjectFile,
      saveProjectFile,
      projectStatus,
      projectStatusMessage,
      project,
      renameProject,
      createNewProject,
      newProjectDialogOpen,
      setNewProjectDialogOpen,
      projectActionError,
      recentProjects,
      openRecentProject,
      duplicateRecentProject,
      deleteRecentProject,
    },
    historyActions: { undo, redo, canUndo, canRedo },
    recipeActions: { applyRecipe },
  } = useEditorDocumentLifecycle(editor)

  const {
    autoKey: { autoKeyEnabled, setAutoKeyEnabled },
    theme: { themeMounted, isLightTheme, themeToggleLabel, setTheme },
    playback: {
      canvas3DRef,
      duration,
      setDuration,
      currentTime,
      setCurrentTime,
      isPlaying,
      loop,
      setLoop,
      isPreviewModelReady,
      setIsPreviewModelReady,
      isVideoExporting,
      videoExportProgress,
      exportTimelineVideo,
      stopVideoExportRecording,
      cancelVideoExport,
      stopPlayback,
      togglePlayback: handlePlayToggle,
      resetPlayback: handleReset,
      animatedSeekEnabled,
      setAnimatedSeekEnabled,
      cancelAnimatedSeek,
      seekToTime,
    },
    shapes: {
      shapes,
      setShapes: setShapesRaw,
      selectedShapeId,
      setSelectedShapeId,
      openShapePicker,
      setShapeIcon: setShapeIconRaw,
      setShapeWipePair: setShapeWipePairRaw,
      setOpenShapePicker,
      activeRecipeId,
      setActiveRecipeId,
      markCustom,
      addShapeAtPlayhead,
      removeShape,
    },
    geometry: {
      wireframe,
      extrusionDepth,
      setExtrusionDepth,
      bevelEnabled,
      setBevelEnabled: setBevelEnabledRaw,
      bevelThickness,
      setBevelThickness: setBevelThicknessRaw,
      bevelSize,
      setBevelSize: setBevelSizeRaw,
      bevelSegments,
      setBevelSegments: setBevelSegmentsRaw,
      geometryQuality,
      setGeometryQuality,
      qualityKeyframes,
      setQualityKeyframes: setQualityKeyframesRaw,
      layerSpacing,
      innerElementScale,
      innerScaleKeyframes,
      setInnerScaleKeyframes: setInnerScaleKeyframesRaw,
    },
    transform: {
      objectScale,
      setObjectScale,
      objectScaleAxes,
      setObjectScaleAxes,
      moveOffset,
      setMoveOffset,
      moveKeyframes,
      setMoveKeyframes: setMoveKeyframesRaw,
      rotationOffset,
      setRotationOffset,
      rotationAxisKeyframes,
      setRotationAxisKeyframes: setRotationAxisKeyframesRaw,
      previewRotationOffset,
      setPreviewRotationOffset,
      isScaleLocked,
      setIsScaleLocked,
    },
    fill: {
      enableGradient,
      fillMode,
      fillColor,
      fillColorSecondary,
      fillGradientType,
      fillStops,
      fillKeyframes,
      setFillKeyframes: setFillKeyframesRaw,
      setGradientEnabled,
      updateFillColor: updateFillColorRaw,
      updateGradientType: updateGradientTypeRaw,
      updateFillStops: updateFillStopsRaw,
    },
    viewport: {
      zoom,
      setZoom,
      viewInertiaEnabled,
      setViewInertiaEnabled,
      showCenterPoint,
      showSelectionOutline,
      setShowCenterPoint,
      setShowSelectionOutline,
      showTransformGizmo,
      setShowTransformGizmo,
      zenMode,
      setZenMode,
      isDragging,
      setIsDragging,
    },
    material: {
      materialPreset,
      roughness,
      metalness,
      reflectance,
      clearcoat,
      clearcoatRoughness,
      transmission,
      thickness,
      emissiveIntensity,
      materialKeyframes,
      setMaterialKeyframes: setMaterialKeyframesRaw,
      isAdvancedMaterialOpen,
      setIsAdvancedMaterialOpen,
      activeMaterialSettings,
      updateMaterialSetting: updateMaterialSettingRaw,
      applyMaterialPreset: applyMaterialPresetRaw,
    },
    light: {
      ambientColor,
      ambientIntensity,
      keyLightColor,
      setKeyLightColor: setKeyLightColorRaw,
      keyLightIntensity,
      setKeyLightIntensity,
      keyLightSoftness,
      setKeyLightSoftness: setKeyLightSoftnessRaw,
      activeKeyLightPosition,
      lightPositionKeyframeAtPlayhead,
      keyLightPositionKeyframes,
      setKeyLightPositionKeyframes: setKeyLightPositionKeyframesRaw,
      toggleLightPositionKeyframeAtPlayhead: toggleLightKeyframeRaw,
      updateLightPositionXY,
      rimLightColor,
      rimLightIntensity,
    },
    selection: {
      inspectorTab,
      setInspectorTab,
      inspectorRefs,
      selectedMotionTrackId,
      setSelectedMotionTrackId,
      selectTimelineTrack,
      selectTimelinePropertyRow,
    },
    timelineTracks: {
      tracks,
      setTracks: setTracksRaw,
      extrusionTrack,
      scaleTrack,
      lightingTrack,
    },
  } = editor

  // Quality frames mirror Depth internally; count the visible keyframes once.
  const keyframeCount =
    tracks.reduce((count, track) => count + track.keyframes.length, 0) +
    fillKeyframes.length +
    materialKeyframes.length +
    keyLightPositionKeyframes.length +
    rotationAxisKeyframes.length +
    moveKeyframes.length +
    innerScaleKeyframes.length
  const keyframeNotice = useKeyframeNotice({
    keyframeCount,
    projectId: project.id,
    currentTime,
    restoring: projectStatus === "restoring",
  })

  const [sessionStyleChanged, setSessionStyleChanged] = useState(false)
  const [sessionMotionAdded, setSessionMotionAdded] = useState(false)

  useEffect(() => {
    setSessionStyleChanged(false)
    setSessionMotionAdded(false)
  }, [project.id])

  const setShapeIcon: typeof setShapeIconRaw = (...args) => {
    return setShapeIconRaw(...args)
  }
  const setShapeWipePair: typeof setShapeWipePairRaw = (...args) => {
    return setShapeWipePairRaw(...args)
  }
  const updateFillColor: typeof updateFillColorRaw = (...args) => {
    setSessionStyleChanged(true)
    return updateFillColorRaw(...args)
  }
  const updateGradientType: typeof updateGradientTypeRaw = (...args) => {
    setSessionStyleChanged(true)
    return updateGradientTypeRaw(...args)
  }
  const updateFillStops: typeof updateFillStopsRaw = (...args) => {
    setSessionStyleChanged(true)
    return updateFillStopsRaw(...args)
  }
  const applyMaterialPreset: typeof applyMaterialPresetRaw = (...args) => {
    setSessionStyleChanged(true)
    return applyMaterialPresetRaw(...args)
  }
  const updateMaterialSetting: typeof updateMaterialSettingRaw = (...args) => {
    setSessionStyleChanged(true)
    return updateMaterialSettingRaw(...args)
  }
  const handleDepthChange: typeof handleDepthChangeRaw = (...args) => {
    setSessionStyleChanged(true)
    return handleDepthChangeRaw(...args)
  }
  const handleBrightnessChange: typeof handleBrightnessChangeRaw = (
    ...args
  ) => {
    setSessionStyleChanged(true)
    return handleBrightnessChangeRaw(...args)
  }
  const setBevelEnabled: typeof setBevelEnabledRaw = (...args) => {
    setSessionStyleChanged(true)
    return setBevelEnabledRaw(...args)
  }
  const setBevelThickness: typeof setBevelThicknessRaw = (...args) => {
    setSessionStyleChanged(true)
    return setBevelThicknessRaw(...args)
  }
  const setBevelSize: typeof setBevelSizeRaw = (...args) => {
    setSessionStyleChanged(true)
    return setBevelSizeRaw(...args)
  }
  const setBevelSegments: typeof setBevelSegmentsRaw = (...args) => {
    setSessionStyleChanged(true)
    return setBevelSegmentsRaw(...args)
  }
  const setKeyLightColor: typeof setKeyLightColorRaw = (...args) => {
    setSessionStyleChanged(true)
    return setKeyLightColorRaw(...args)
  }
  const setKeyLightSoftness: typeof setKeyLightSoftnessRaw = (...args) => {
    setSessionStyleChanged(true)
    return setKeyLightSoftnessRaw(...args)
  }
  // Track any keyframe mutation this session so the guide's motion step
  // completes only on genuine user action.
  const setFillKeyframes: typeof setFillKeyframesRaw = (...args) => {
    setSessionMotionAdded(true)
    return setFillKeyframesRaw(...args)
  }
  const setMaterialKeyframes: typeof setMaterialKeyframesRaw = (...args) => {
    setSessionMotionAdded(true)
    return setMaterialKeyframesRaw(...args)
  }
  const setKeyLightPositionKeyframes: typeof setKeyLightPositionKeyframesRaw = (
    ...args
  ) => {
    setSessionMotionAdded(true)
    return setKeyLightPositionKeyframesRaw(...args)
  }
  const setRotationAxisKeyframes: typeof setRotationAxisKeyframesRaw = (
    ...args
  ) => {
    setSessionMotionAdded(true)
    return setRotationAxisKeyframesRaw(...args)
  }
  const setMoveKeyframes: typeof setMoveKeyframesRaw = (...args) => {
    setSessionMotionAdded(true)
    return setMoveKeyframesRaw(...args)
  }
  const setQualityKeyframes: typeof setQualityKeyframesRaw = (...args) => {
    setSessionMotionAdded(true)
    return setQualityKeyframesRaw(...args)
  }
  const setInnerScaleKeyframes: typeof setInnerScaleKeyframesRaw = (
    ...args
  ) => {
    setSessionMotionAdded(true)
    return setInnerScaleKeyframesRaw(...args)
  }
  const setShapes: typeof setShapesRaw = (...args) => {
    // Icon picker/upload flows mutate shapes via setShapes; mark the
    // guide's icon step done on any shape mutation this session.
    return setShapesRaw(...args)
  }
  const setTracks: typeof setTracksRaw = (...args) => {
    setSessionMotionAdded(true)
    return setTracksRaw(...args)
  }
  const toggleLightPositionKeyframeAtPlayhead = () => {
    setSessionMotionAdded(true)
    toggleLightKeyframeRaw()
  }
  const {
    sortedShapes,
    morph,
    selectedShapeFill,
    selectedShapeFillSecondary,
    selectedShapeGradientType,
    selectedShapeFillStops,
    iconAContent,
    iconBContent,
    colorA,
    renderColorASecondary,
    renderColorAStops,
    renderColorB,
    renderColorBSecondary,
    renderColorBStops,
    activeTransitionProgress,
    transitionType,
    wipeDirection,
    renderEnableGradient,
    renderGradientType,
    selectedShapeLayers,
    selectedLayerId,
    selectedLayerOverride,
    hiddenLayerIds,
    setSelectedLayerId,
    updateSelectedLayerScale,
    updateSelectedLayerDepth,
    toggleSelectedLayerVisibility,
    shapeNavigation,
    activeExtrusionDepth,
    activeRotationOffset,
    activeObjectScale,
    activeMoveOffset,
    activeKeyLightIntensity,
    activeGeometryQuality,
    activeInnerScale,
  } = useEditorRenderState({
    shapes,
    setShapes,
    selectedShapeId,
    setSelectedShapeId,
    setOpenShapePicker,
    addShapeAtPlayhead,
    currentTime,
    fillColor,
    fillColorSecondary,
    fillGradientType,
    fillStops,
    fillKeyframes,
    fillMode,
    enableGradient,
    extrusionTrack,
    scaleTrack,
    lightingTrack,
    extrusionDepth,
    rotationOffset,
    rotationAxisKeyframes,
    previewRotationOffset,
    objectScale,
    moveOffset,
    moveKeyframes,
    keyLightIntensity,
    geometryQuality,
    qualityKeyframes,
    innerElementScale,
    innerScaleKeyframes,
    markCustom,
  })

  const {
    handleDepthChange: handleDepthChangeRaw,
    handleRotationAxisChange,
    handleScaleChange,
    handleScaleAxisChange,
    handleViewRotationCommit,
    handleViewRotationSet,
    handleBrightnessChange: handleBrightnessChangeRaw,
    updateMoveAxis,
    updateQuality,
    resetView,
  } = useEditorMotionSurface({
    currentTime,
    isPlaying,
    duration,
    tracks,
    setTracks,
    setSelectedMotionTrackId,
    setActiveRecipeId,
    setExtrusionDepth,
    setRotationOffset,
    activeRotationOffset,
    rotationAxisKeyframes,
    setRotationAxisKeyframes,
    setPreviewRotationOffset,
    setObjectScale,
    activeObjectScale,
    objectScaleAxes,
    setObjectScaleAxes,
    setIsScaleLocked,
    activeMoveOffset,
    moveKeyframes,
    setMoveOffset,
    setMoveKeyframes,
    setKeyLightIntensity,
    setGeometryQuality,
    setQualityKeyframes,
    geometryQuality,
    canvas3DRef,
    autoKeyEnabled,
  })

  const {
    openExport,
    uploadFileRef,
    handleUploadInputChange,
    handleDropSvg,
    triggerShapeUpload,
    svgImportError,
    clearSvgImportError,
    exportModalProps,
  } = useEditorExportSurface({
    selectedShapeId,
    onShapeIconChange: setShapeIcon,
    previewState: {
      document: documentSnapshot,
      currentTime,
      wireframe,
      ambientColor,
      rimLightColor,
    },
    canvasRef: canvas3DRef,
    exportTimelineVideo: (settings) => {
      canvas3DRef.current?.commitRotationEdit()
      cancelAnimatedSeek()
      const frozenDocument = structuredClone(documentSnapshot)
      const studio = { ...canvasProps }
      return exportTimelineVideo(settings, (time) =>
        evaluateExportFrame(frozenDocument, time, studio)
      )
    },
    stopVideoExportRecording,
    cancelVideoExport,
    isVideoExporting,
    videoExportProgress,
    duration,
    shapes,
    tracks,
    rotationOffset,
    rotationAxisKeyframes,
    objectScale,
    objectScaleAxes,
    moveOffset,
    moveKeyframes,
    keyLightPosition: activeKeyLightPosition,
    keyLightPositionKeyframes,
    fillKeyframes,
    materialSettings: activeMaterialSettings,
    materialKeyframes,
    materialPreset,
    colorA,
    colorB: renderColorB,
    roughness,
    metalness,
    reflectance,
    clearcoat,
    clearcoatRoughness,
    transmission,
    thickness,
    emissiveIntensity,
    extrusionDepth: activeExtrusionDepth,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelSegments,
    layerSpacing,
    ambientIntensity,
    keyLightIntensity: activeKeyLightIntensity,
    rimLightIntensity,
    svgPathA: iconAContent,
    svgPathB: iconBContent,
  })

  const applyRecipeFromGuide = (recipe: MotionRecipe) => {
    // Guide template buttons mutate style and motion at once; mark both
    // session flags so the corresponding steps complete.
    setSessionStyleChanged(true)
    setSessionMotionAdded(true)
    applyRecipe(recipe)
  }

  const creationJourney = useCreationJourney({
    projectId: project.id,
    isPlaying,
    togglePlayback: handlePlayToggle,
    hasStyle: sessionStyleChanged,
    hasMotion: sessionMotionAdded && keyframeCount > 0,
    onExport: () => {
      cancelAnimatedSeek()
      stopPlayback()
      openExport()
    },
  })

  const {
    timelineProps,
    previousKeyMoment,
    nextKeyMoment,
    atTimelineStart,
    atTimelineEnd,
    playbackProgress,
    goToPreviousKeyMoment,
    goToNextKeyMoment,
    goToEnd,
  } = useEditorTimelineSurface({
    playback: {
      currentTime,
      setCurrentTime,
      duration,
      setDuration,
      seekToTime,
      cancelAnimatedSeek,
      stopPlayback,
      isPlaying,
      isPreviewModelReady,
      loop,
      setLoop,
    },
    tracksState: {
      tracks,
      setTracks,
      selectedMotionTrackId,
      selectTimelineTrack,
      selectTimelinePropertyRow,
    },
    shapeState: {
      sortedShapes,
      shapes,
      setShapes,
      selectedShapeId,
      setSelectedShapeId,
      openShapePicker,
      setOpenShapePicker,
    },
    animatedProperties: {
      fillKeyframes,
      setFillKeyframes,
      materialKeyframes,
      setMaterialKeyframes,
      keyLightPositionKeyframes,
      setKeyLightPositionKeyframes,
      rotationAxisKeyframes,
      setRotationAxisKeyframes,
      moveKeyframes,
      setMoveKeyframes,
      setQualityKeyframes,
      setInnerScaleKeyframes,
    },
    activeValues: {
      selectedShapeFillStops,
      selectedShapeGradientType,
      activeMaterialSettings,
      activeKeyLightPosition,
      activeRotationOffset,
      activeMoveOffset,
    },
    shapeActions: {
      setShapeIcon,
      setShapeWipePair,
      addShapeAtPlayhead,
      removeShape,
      triggerShapeUpload,
    },
    markCustom,
  })
  useTimelineStepShortcuts({
    onPreviousKeyframe: goToPreviousKeyMoment,
    onNextKeyframe: goToNextKeyMoment,
    onStepFrames: (frames) => {
      cancelAnimatedSeek()
      stopPlayback()
      setCurrentTime((time) =>
        Math.max(
          0,
          Math.min(
            duration,
            (Math.round(time * TIMELINE_FRAME_RATE) + frames) /
              TIMELINE_FRAME_RATE
          )
        )
      )
    },
  })

  const { canvasProps, viewOptionsProps, playbackProps } =
    useEditorViewportSurface({
      iconAContent,
      iconBContent,
      materialPreset,
      colorA,
      colorB: renderColorB,
      colorASecondary: renderColorASecondary,
      colorBSecondary: renderColorBSecondary,
      colorAStops: renderColorAStops,
      colorBStops: renderColorBStops,
      enableGradient: renderEnableGradient,
      gradientType: renderGradientType,
      activeMaterialSettings,
      wireframe,
      extrusionDepth: activeExtrusionDepth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      geometryQuality: activeGeometryQuality,
      layerSpacing,
      innerElementScale: activeInnerScale,
      transitionType,
      wipeDirection,
      transitionProgress: activeTransitionProgress,
      rotationOffset: activeRotationOffset,
      objectScale: activeObjectScale,
      objectScaleAxes,
      moveOffset: activeMoveOffset,
      isPlaying,
      ambientColor,
      ambientIntensity,
      keyLightColor,
      keyLightIntensity: activeKeyLightIntensity,
      keyLightPosition: activeKeyLightPosition,
      keyLightSoftness,
      rimLightColor,
      rimLightIntensity,
      zoom,
      viewInertiaEnabled,
      showCenterPoint,
      showSelectionOutline,
      showTransformGizmo,
      selectedLayerId,
      selectedIconColorRole: (() => {
        const shape = shapes.find((item) => item.id === selectedShapeId)
        if (!shape) return undefined
        return morph.from.id === shape.id ? "a" : "b"
      })(),
      pathOverridesA: morph.from.pathOverrides,
      pathOverridesB: morph.to.pathOverrides,
      exportAnimation: {
        duration,
        tracks,
        extrusionDepth: activeExtrusionDepth,
        rotationOffset,
        rotationAxisKeyframes,
        objectScale,
        objectScaleAxes,
        moveOffset,
        moveKeyframes,
      },
      playbackProgress,
      atTimelineStart,
      atTimelineEnd,
      hasPreviousKeyMoment: previousKeyMoment !== undefined,
      hasNextKeyMoment: nextKeyMoment !== undefined,
      zenMode,
      animatedSeekEnabled,
      setZoom,
      handleViewRotationCommit,
      handleViewRotationSet,
      handleScaleChange,
      handleScaleAxisChange,
      updateMoveAxis,
      onSelectLayer: setSelectedLayerId,
      onDeselectLayers: () => setSelectedLayerId(ALL_LAYERS_ID),
      handleRotationAxisChange,
      setIsPreviewModelReady,
      resetView,
      setViewInertiaEnabled,
      setShowCenterPoint,
      setShowSelectionOutline,
      setShowTransformGizmo,
      setAnimatedSeekEnabled,
      handleReset,
      goToPreviousKeyMoment,
      handlePlayToggle,
      goToNextKeyMoment,
      goToEnd,
      setZenMode,
      markCustom,
    })

  const { styleProps, geometryProps, transformProps, lightProps } =
    useEditorInspectorSurface({
      currentTime,
      duration,
      setTracks,
      setSelectedMotionTrackId,
      setActiveRecipeId,
      selectedShapeFillStops,
      selectedShapeGradientType,
      activeMaterialSettings,
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
      fillRef: inspectorRefs.fill,
      materialRef: inspectorRefs.material,
      materialPreset,
      materialKeyframeCount: materialKeyframes.length,
      isAdvancedMaterialOpen,
      selectedShapeFill,
      selectedShapeFillSecondary,
      fillMode,
      onFillColorChange: updateFillColor,
      onGradientToggle: setGradientEnabled,
      onGradientTypeChange: updateGradientType,
      onStopsChange: updateFillStops,
      onMaterialPresetChange: applyMaterialPreset,
      onAdvancedMaterialOpenChange: setIsAdvancedMaterialOpen,
      onMaterialSettingChange: updateMaterialSetting,
      extrusionRef: inspectorRefs.extrusion,
      selectedMotionTrackId,
      extrusionTrack,
      activeExtrusionDepth,
      extrusionDepth,
      activeGeometryQuality,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      onDepthChange: handleDepthChange,
      onBevelEnabledChange: setBevelEnabled,
      onBevelThicknessChange: setBevelThickness,
      onBevelSizeChange: setBevelSize,
      onBevelSegmentsChange: setBevelSegments,
      onQualityChange: updateQuality,
      onCustomEdit: markCustom,
      scaleRef: inspectorRefs.scale,
      rotationRef: inspectorRefs.rotation,
      moveRef: inspectorRefs.move,
      objectScale,
      objectScaleAxes,
      isScaleLocked,
      rotationOffset: activeRotationOffset,
      moveKeyframesLength: moveKeyframes.length,
      selectedShapeLayers,
      selectedLayerId,
      selectedLayerOverride,
      hiddenLayerIds,
      shapeNavigation,
      onScaleLockChange: setIsScaleLocked,
      onScaleChange: handleScaleChange,
      onScaleAxisChange: handleScaleAxisChange,
      onRotationAxisChange: handleRotationAxisChange,
      onMoveAxisChange: updateMoveAxis,
      onSelectLayer: setSelectedLayerId,
      onToggleLayerVisibility: toggleSelectedLayerVisibility,
      onLayerScaleChange: updateSelectedLayerScale,
      onLayerDepthChange: updateSelectedLayerDepth,
      lightingRef: inspectorRefs.lighting,
      lightingTrack,
      activeKeyLightIntensity,
      keyLightIntensity,
      activeKeyLightPosition,
      keyLightColor,
      keyLightSoftness,
      lightPositionIsKeyed: Boolean(lightPositionKeyframeAtPlayhead()),
      onLightPositionChange: updateLightPositionXY,
      onLightColorChange: setKeyLightColor,
      onLightSoftnessChange: setKeyLightSoftness,
      onToggleLightPositionKeyframe: toggleLightPositionKeyframeAtPlayhead,
      onBrightnessChange: handleBrightnessChange,
    })

  const toggleInspectorPropertyKeyframe = (
    rowId: string,
    keyframes: Array<{ id: string; time: number }>
  ) => {
    stopPlayback()
    timelineProps.onTogglePropertyKeyframe?.(
      rowId,
      findKeyframeAtTime(keyframes, currentTime)?.id
    )
  }

  return {
    onCreateStarter: (starterId, name, svgContent) => {
      if (!createNewProject("blank", name, starterId, svgContent)) return false
      setAutoKeyEnabled(false)
      return true
    },
    animationProps: {
      duration,
      existingKeyframes: {
        Rotation: rotationAxisKeyframes.length,
        Scale: scaleTrack.keyframes.length,
      },
      onApply: (id, seconds, intensity) => {
        stopPlayback()
        cancelAnimatedSeek()
        const presetDuration = clampTimelineDuration(seconds)
        const result = createAnimationPreset({
          id,
          duration: presetDuration,
          intensity,
          rotation: rotationAxisKeyframes[0]?.value ?? rotationOffset,
          scale: scaleTrack.keyframes[0]?.value ?? objectScale,
          scaleTrack,
        })
        timelineProps.onDurationChange(presetDuration)
        if (result.rotationKeyframes)
          setRotationAxisKeyframes(result.rotationKeyframes)
        if (result.scaleTrack)
          setTracks((previous) =>
            previous.map((track) =>
              track.id === "scale" ? result.scaleTrack! : track
            )
          )
        setCurrentTime(0)
        setPreviewRotationOffset(null)
        markCustom()
      },
    },
    keyframeNotice,
    topBarProps: {
      zenMode,
      themeMounted,
      isLightTheme,
      themeToggleLabel,
      onZenModeChange: setZenMode,
      onThemeChange: setTheme,
      onProjectNew: newProject,
      onProjectOpen: openProjectFile,
      onProjectSave: saveProjectFile,
      projectStatus,
      projectStatusMessage,
      projectName: project.name,
      onProjectNameChange: renameProject,
      onUndo: undo,
      onRedo: redo,
      canUndo,
      canRedo,
      onExportOpen: creationJourney.openExport,
    },
    viewportProps: {
      zenMode,
      isDragging,
      onDragStateChange: setIsDragging,
      onDropSvg: handleDropSvg,
      svgImportError,
      onSvgImportErrorDismiss: clearSvgImportError,
      canvasProps,
      viewOptionsProps,
      playbackProps,
      creationJourney,
    },
    inspectorProps: {
      activeTab: inspectorTab,
      onTabChange: setInspectorTab,
      editScopeProps: {
        currentTime,
        autoKeyEnabled,
        onAutoKeyChange: setAutoKeyEnabled,
        properties: [
          {
            name: "Rotation",
            times: rotationAxisKeyframes.map((k) => k.time),
            onToggle: () => {
              canvas3DRef.current?.commitRotationEdit()
              toggleInspectorPropertyKeyframe("rotation", rotationAxisKeyframes)
            },
          },
          {
            name: "Position",
            times: moveKeyframes.map((k) => k.time),
            onToggle: () =>
              toggleInspectorPropertyKeyframe("move", moveKeyframes),
          },
          {
            name: "Fill",
            times: fillKeyframes.map((k) => k.time),
            onToggle: () =>
              toggleInspectorPropertyKeyframe("fill", fillKeyframes),
          },
          {
            name: "Finish",
            times: materialKeyframes.map((k) => k.time),
            onToggle: () =>
              toggleInspectorPropertyKeyframe("material", materialKeyframes),
          },
          {
            name: "Quality",
            times: qualityKeyframes.map((k) => k.time),
            onToggle: () => {
              stopPlayback()
              markCustom()
              const time = normalizedPlayheadTime(currentTime, duration)
              setQualityKeyframes((keyframes) =>
                findKeyframeAtTime(keyframes, time)
                  ? removeKeyframesAtTime(keyframes, time)
                  : addKeyframeAtTime({
                      keyframes,
                      time,
                      create: (easing) => ({
                        id: createEditorId("quality"),
                        time,
                        value: activeGeometryQuality,
                        easing,
                      }),
                    })
              )
            },
          },
          {
            name: "Light direction",
            times: keyLightPositionKeyframes.map((k) => k.time),
            onToggle: () => {
              stopPlayback()
              toggleLightPositionKeyframeAtPlayhead()
            },
          },
          ...tracks
            .filter((t) => t.id !== "rotation" && t.id !== "transition")
            .map((t) => ({
              name: t.name,
              times: t.keyframes.map((k) => k.time),
              onToggle: () => {
                stopPlayback()
                markCustom()
                const value =
                  t.id === "scale"
                    ? activeObjectScale
                    : t.id === "extrusion"
                      ? activeExtrusionDepth
                      : activeKeyLightIntensity
                setTracks((prev) =>
                  toggleScalarTrackKeyframeAtTime({
                    tracks: prev,
                    trackId: t.id,
                    value,
                    time: currentTime,
                    duration,
                  })
                )
              },
            })),
        ],
      },
      zenMode,
      styleProps,
      geometryProps,
      transformProps,
      lightProps,
    },
    timelineProps: {
      zenMode,
      timelineProps: {
        ...timelineProps,
        motionRecipes: MOTION_RECIPES,
        activeRecipeId,
        onApplyMotionRecipe: applyRecipeFromGuide,
      },
    },
    exportModalProps,
    newProjectDialogProps: {
      open: newProjectDialogOpen,
      currentProjectId: project.id,
      recentProjects,
      onOpenChange: setNewProjectDialogOpen,
      onCreate: createNewProject,
      actionError: projectActionError,
      onOpenRecent: openRecentProject,
      onDuplicateRecent: duplicateRecentProject,
      onDeleteRecent: deleteRecentProject,
      onDownloadCurrent: saveProjectFile,
      onImportFile: openProjectFile,
    },
    uploadFileRef,
    canvas3DRef,
    onUploadInputChange: handleUploadInputChange,
  }
}
