"use client"

import { useCallback, useMemo } from "react"
import { useLatestRef, useStableHandlers } from "@/lib/use-latest-ref"
import type { SvgCanvasProps } from "../3d/SvgTypes"
import { createAnimationPreset } from "./AnimationPresetModel"
import type { AppLayoutViewProps } from "./AppLayoutView"
import { createEditorAtTime } from "./EditorAtTime"
import { buildEditorInspectorProps } from "./EditorInspectorProps"
import { STATIC_STUDIO_LIGHTING } from "./LightEditActions"
import { createDocumentFrameEvaluator } from "./EditorFrameModel"
import { countDocumentKeyframes } from "./KeyframeChannelModel"
import { MOTION_RECIPES, type MotionRecipe } from "./MotionRecipes"
import { scalarTimelineTracks } from "./PropertyRegistry"
import { ALL_LAYERS_ID } from "./SvgLayerModel"
import { clampTimelineDuration } from "./TimelineDurationModel"
import { TIMELINE_FRAME_RATE } from "./timeline/TimelineGeometry"
import type { CanvasSource } from "./ViewportStage"
import { useCreationJourney } from "./useCreationJourney"
import { useEditorBaseState } from "./useEditorBaseState"
import { useEditorDocumentLifecycle } from "./useEditorDocumentLifecycle"
import { useEditorExportSurface } from "./useEditorExportSurface"
import { useEditorRenderState } from "./useEditorRenderState"
import { useTimelineStepShortcuts } from "./useEditorShortcuts"
import { useKeyframeNotice } from "./useKeyframeNotice"
import { useTimelineDockController } from "./useTimelineDockController"
import { useViewportStageProps } from "./useViewportStageProps"

/** Wires the editor's state to the layout's panels. */
export function useAppLayoutController(): AppLayoutViewProps {
  const editor = useEditorBaseState()
  const {
    store,
    document,
    theme,
    playback,
    shapes,
    advancedMaterial,
    viewport,
    selection,
    transform,
  } = editor
  const { historyActions, projectFiles, applyRecipe } =
    useEditorDocumentLifecycle(editor)
  const { project } = projectFiles
  const {
    canvas3DRef,
    clock,
    currentTime,
    setCurrentTime,
    isPlaying,
    stopPlayback,
    cancelAnimatedSeek,
  } = playback
  const { duration } = document

  const render = useEditorRenderState({
    store,
    document,
    selectedShapeId: shapes.selectedShapeId,
    setSelectedShapeId: shapes.setSelectedShapeId,
    setOpenShapePicker: shapes.setOpenShapePicker,
    addShapeAtPlayhead: shapes.addShapeAtPlayhead,
    markCustom: shapes.markCustom,
  })

  // The editor at any moment. `rest` is where the playhead rests; the moving
  // frame (clock) is used by the inspector during playback and by edits.
  const editorAt = (time: number) =>
    createEditorAtTime(
      {
        store,
        document,
        preparation: render.preparation,
        scalarTracks: render.scalarTracks,
        previewRotationOffset: transform.previewRotationOffset,
        isPlaying,
        setSelectedMotionTrackId: selection.setSelectedMotionTrackId,
        setPreviewRotationOffset: transform.setPreviewRotationOffset,
        setIsScaleLocked: transform.setIsScaleLocked,
        canvas3DRef,
      },
      time
    )
  const rest = editorAt(currentTime)
  /** Edits act on the frame on screen, which moves during playback. */
  const motionNow = () => editorAt(clock.get()).motion

  const keyframeCount = countDocumentKeyframes(document)
  const keyframeNotice = useKeyframeNotice({
    keyframeCount,
    projectId: project.id,
    currentTime,
    restoring: projectFiles.projectStatus === "restoring",
  })

  // Grabbing the icon stops it on the frame you see, so the drag edits
  // Rotation there (keying it, when Rotation is animated) instead of fighting
  // playback and keying wherever the playhead happens to be.
  const holdFrameForCanvasEdit = () => {
    cancelAnimatedSeek()
    if (isPlaying) stopPlayback()
  }

  const canvasHandlers = useStableHandlers({
    onZoomChange: viewport.setZoom,
    onViewRotationCommit: ((delta) => {
      holdFrameForCanvasEdit()
      motionNow().handleViewRotationCommit(delta)
    }) satisfies NonNullable<SvgCanvasProps["onViewRotationCommit"]>,
    onViewRotationSet: ((target, options) => {
      holdFrameForCanvasEdit()
      motionNow().handleViewRotationSet(target, options)
    }) satisfies NonNullable<SvgCanvasProps["onViewRotationSet"]>,
    onObjectScaleChange: (scale: number) =>
      motionNow().handleScaleChange(scale),
    onObjectScaleAxisChange: ((axis, value) =>
      motionNow().handleScaleAxisChange(axis, value)) satisfies NonNullable<
      SvgCanvasProps["onObjectScaleAxisChange"]
    >,
    onMoveOffsetChange: ((axis, value) =>
      motionNow().updateMoveAxis(axis, value)) satisfies NonNullable<
      SvgCanvasProps["onMoveOffsetChange"]
    >,
    onRotationAxisChange: ((axis, value) =>
      motionNow().handleRotationAxisChange(axis, value)) satisfies NonNullable<
      SvgCanvasProps["onRotationAxisChange"]
    >,
    onSelectLayer: render.setSelectedLayerId,
    onDeselectLayers: () => render.setSelectedLayerId(ALL_LAYERS_ID),
    onModelReadyChange: playback.setIsPreviewModelReady,
  })

  // Videos and frame sheets render the document as it was when they start.
  const frameEvaluatorRef = useLatestRef(() => {
    canvas3DRef.current?.commitRotationEdit()
    const evaluate = createDocumentFrameEvaluator(structuredClone(store.get()))
    const studio = { ...canvasProps }
    return (time: number): SvgCanvasProps => ({
      ...studio,
      ...evaluate(time),
      isPlaying: false,
    })
  })
  const createFrameEvaluator = useCallback(
    () => frameEvaluatorRef.current(),
    [frameEvaluatorRef]
  )

  const exportSurface = useEditorExportSurface({
    selectedShapeId: shapes.selectedShapeId,
    onShapeIconChange: shapes.setShapeIcon,
    previewState: {
      document,
      currentTime,
      wireframe: false,
      ambientColor: STATIC_STUDIO_LIGHTING.ambientColor,
      rimLightColor: STATIC_STUDIO_LIGHTING.rimLightColor,
    },
    lighting: STATIC_STUDIO_LIGHTING,
    canvasRef: canvas3DRef,
    createFrameEvaluator,
    exportTimelineVideo: (settings) => {
      cancelAnimatedSeek()
      return playback.exportTimelineVideo(settings, createFrameEvaluator())
    },
    cancelVideoExport: playback.cancelVideoExport,
    isVideoExporting: playback.isVideoExporting,
    videoExportProgress: playback.videoExportProgress,
  })

  const creationJourney = useCreationJourney({
    store,
    projectId: project.id,
    keyframeCount,
    isPlaying,
    togglePlayback: playback.togglePlayback,
    onExport: () => {
      cancelAnimatedSeek()
      stopPlayback()
      exportSurface.openExport()
    },
  })

  const timeline = useTimelineDockController({
    store,
    document,
    playback,
    selection,
    shapes: {
      ...shapes,
      sortedShapes: render.sortedShapes,
      triggerShapeUpload: exportSurface.triggerShapeUpload,
    },
    activeValuesAt: (time) => {
      const at = editorAt(time)
      return {
        selectedShapeFillStops: at.selectedShapeFillStops,
        selectedShapeGradientType: at.selectedShapeGradientType,
        activeMaterialSettings: at.activeMaterialSettings,
        activeKeyLightPosition: at.activeKeyLightPosition,
        activeRotationOffset: at.activeRotationOffset,
        activeMoveOffset: at.activeMoveOffset,
      }
    },
  })

  const jumpTo = (time: number) => {
    cancelAnimatedSeek()
    stopPlayback()
    setCurrentTime(time)
  }
  useTimelineStepShortcuts({
    onPreviousKeyframe: timeline.goToPreviousKeyMoment,
    onNextKeyframe: timeline.goToNextKeyMoment,
    onStepFrames: (frames) =>
      jumpTo(
        Math.max(
          0,
          Math.min(
            duration,
            (Math.round(clock.get() * TIMELINE_FRAME_RATE) + frames) /
              TIMELINE_FRAME_RATE
          )
        )
      ),
    onGoToStart: () => jumpTo(0),
    onGoToEnd: () => jumpTo(duration),
  })

  const selectedShape = document.shapes.find(
    (shape) => shape.id === shapes.selectedShapeId
  )
  const { canvasProps, viewOptionsProps, playbackProps } =
    useViewportStageProps({
      ...canvasHandlers,
      isPlaying,
      clock,
      duration,
      wireframe: false,
      lighting: STATIC_STUDIO_LIGHTING,
      zoom: viewport.zoom,
      viewInertiaEnabled: viewport.viewInertiaEnabled,
      showCenterPoint: viewport.showCenterPoint,
      showSelectionOutline: viewport.showSelectionOutline,
      showTransformGizmo: viewport.showTransformGizmo,
      selectedLayerId: render.selectedLayerId,
      selectedIconColorRole: selectedShape
        ? rest.morph.from.id === selectedShape.id
          ? "a"
          : "b"
        : undefined,
      atTimelineStart: timeline.atTimelineStart,
      atTimelineEnd: timeline.atTimelineEnd,
      hasPreviousKeyMoment: timeline.previousKeyMoment !== undefined,
      hasNextKeyMoment: timeline.nextKeyMoment !== undefined,
      zenMode: viewport.zenMode,
      animatedSeekEnabled: playback.animatedSeekEnabled,
      onResetView: () => motionNow().resetView(),
      onViewInertiaChange: viewport.setViewInertiaEnabled,
      onShowCenterPointChange: viewport.setShowCenterPoint,
      onShowSelectionOutlineChange: viewport.setShowSelectionOutline,
      onShowTransformGizmoChange: viewport.setShowTransformGizmo,
      onAnimatedSeekChange: playback.setAnimatedSeekEnabled,
      onResetPlayback: playback.resetPlayback,
      onPreviousKeyMoment: timeline.goToPreviousKeyMoment,
      onPlayToggle: playback.togglePlayback,
      onNextKeyMoment: timeline.goToNextKeyMoment,
      onGoToEnd: timeline.goToEnd,
      onExitZenMode: () => viewport.setZenMode(false),
    })
  const canvasSource = useMemo<CanvasSource>(
    () => ({
      document,
      clock,
      previewRotationOffset: transform.previewRotationOffset,
    }),
    [clock, document, transform.previewRotationOffset]
  )

  const inspectorAt = (time: number) =>
    buildEditorInspectorProps({
      store,
      document,
      at: time === currentTime ? rest : editorAt(time),
      render,
      setCurrentTime,
      stopPlayback,
      canvas3DRef,
      selection,
      transform,
      advancedMaterial,
      togglePropertyKeyframe: timeline.togglePropertyKeyframe,
    })

  const applyAnimationPreset: AppLayoutViewProps["animationProps"]["onApply"] =
    (id, seconds, intensity) => {
      stopPlayback()
      cancelAnimatedSeek()
      const presetDuration = clampTimelineDuration(seconds)
      timeline.timelineProps.onDurationChange(presetDuration)
      const current = store.get()
      const { scaleTrack } = scalarTimelineTracks(current.tracks)
      const result = createAnimationPreset({
        id,
        duration: presetDuration,
        intensity,
        rotation:
          current.rotationAxisKeyframes[0]?.value ?? current.rotationOffset,
        scale: scaleTrack.keyframes[0]?.value ?? current.objectScale,
        scaleTrack,
      })
      store.patch({
        activeRecipeId: null,
        ...(result.rotationKeyframes && {
          rotationAxisKeyframes: result.rotationKeyframes,
        }),
        ...(result.scaleTrack && {
          tracks: current.tracks.map((track) =>
            track.id === "scale" ? result.scaleTrack! : track
          ),
        }),
      })
      setCurrentTime(0)
      transform.setPreviewRotationOffset(null)
    }

  const {
    projectStatus,
    projectStatusMessage,
    newProjectDialogOpen,
    setNewProjectDialogOpen,
    createNewProject,
  } = projectFiles

  return {
    onCreateStarter: (starterId, name, svgContent) =>
      createNewProject("blank", name, starterId, svgContent),
    animationProps: {
      duration,
      existingKeyframes: {
        Rotation: document.rotationAxisKeyframes.length,
        Scale: render.scalarTracks.scaleTrack.keyframes.length,
      },
      onApply: applyAnimationPreset,
    },
    keyframeNotice,
    topBarProps: {
      zenMode: viewport.zenMode,
      themeMounted: theme.themeMounted,
      isLightTheme: theme.isLightTheme,
      themeToggleLabel: theme.themeToggleLabel,
      onZenModeChange: viewport.setZenMode,
      onThemeChange: theme.setTheme,
      onProjectNew: projectFiles.newProject,
      onProjectOpen: projectFiles.openProjectFile,
      onProjectSave: projectFiles.saveProjectFile,
      projectStatus,
      projectStatusMessage,
      projectName: project.name,
      onProjectNameChange: projectFiles.renameProject,
      onUndo: historyActions.undo,
      onRedo: historyActions.redo,
      canUndo: historyActions.canUndo,
      canRedo: historyActions.canRedo,
      onExportOpen: creationJourney.openExport,
    },
    viewportProps: {
      zenMode: viewport.zenMode,
      isDragging: viewport.isDragging,
      onDragStateChange: viewport.setIsDragging,
      onDropSvg: exportSurface.handleDropSvg,
      svgImportError: exportSurface.svgImportError,
      onSvgImportErrorDismiss: exportSurface.clearSvgImportError,
      canvasProps,
      canvasSource,
      viewOptionsProps,
      playbackProps,
      creationJourney,
    },
    inspectorProps: {
      activeTab: selection.inspectorTab,
      onTabChange: selection.setInspectorTab,
      zenMode: viewport.zenMode,
      ...inspectorAt(currentTime),
      playhead: { clock, isPlaying, propsAt: inspectorAt },
    },
    timelineProps: {
      zenMode: viewport.zenMode,
      timelineProps: {
        ...timeline.timelineProps,
        motionRecipes: MOTION_RECIPES,
        activeRecipeId: document.activeRecipeId,
        onApplyMotionRecipe: (recipe: MotionRecipe) => applyRecipe(recipe),
      },
    },
    exportModalProps: exportSurface.exportModalProps,
    newProjectDialogProps: {
      open: newProjectDialogOpen,
      currentProjectId: project.id,
      recentProjects: projectFiles.recentProjects,
      onOpenChange: setNewProjectDialogOpen,
      onCreate: createNewProject,
      actionError: projectFiles.projectActionError,
      onOpenRecent: projectFiles.openRecentProject,
      onDuplicateRecent: projectFiles.duplicateRecentProject,
      onDeleteRecent: projectFiles.deleteRecentProject,
      onDownloadCurrent: projectFiles.saveProjectFile,
      onImportFile: projectFiles.openProjectFile,
    },
    uploadFileRef: exportSurface.uploadFileRef,
    canvas3DRef,
    onUploadInputChange: exportSurface.handleUploadInputChange,
  }
}
