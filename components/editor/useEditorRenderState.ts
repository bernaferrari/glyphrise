"use client"

import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import type { EditorSnapshot } from "./EditorModel"
import { scalarTimelineTracks } from "./PropertyRegistry"
import type { ShapeStop } from "./TimelineModel"
import { useLayerEditor } from "./useLayerEditor"
import { prepareMorphRenderState } from "./useMorphRenderState"
import { useShapeNavigation } from "./useShapeNavigation"

type UseEditorRenderStateArgs = {
  store: EditorDocumentStore
  document: EditorSnapshot
  selectedShapeId: string | null
  setSelectedShapeId: Dispatch<SetStateAction<string | null>>
  setOpenShapePicker: Dispatch<SetStateAction<string | null>>
  addShapeAtPlayhead: () => void
  markCustom: () => void
}

/**
 * What the editor derives from the document regardless of the playhead: clip
 * order and prepared fills, the scalar tracks, and the selected icon's layers.
 * Values at a given time come from `createEditorAtTime`.
 */
export function useEditorRenderState({
  store,
  document,
  selectedShapeId,
  setSelectedShapeId,
  setOpenShapePicker,
  addShapeAtPlayhead,
  markCustom,
}: UseEditorRenderStateArgs) {
  const { tracks, shapes, fillKeyframes } = document
  const scalarTracks = useMemo(() => scalarTimelineTracks(tracks), [tracks])
  const preparation = useMemo(
    () => prepareMorphRenderState(shapes, fillKeyframes),
    [fillKeyframes, shapes]
  )

  const setShapes = useCallback(
    (action: SetStateAction<ShapeStop[]>) => store.set("shapes", action),
    [store]
  )
  const layerState = useLayerEditor({
    shapes,
    selectedShapeId,
    setShapes,
    onEdit: markCustom,
  })

  const shapeNavigation = useShapeNavigation({
    sortedShapes: preparation.sortedShapes,
    selectedShapeId,
    setSelectedShapeId,
    setOpenShapePicker,
    setSelectedLayerId: layerState.setSelectedLayerId,
    addShapeAtPlayhead,
  })

  return {
    scalarTracks,
    preparation,
    sortedShapes: preparation.sortedShapes,
    ...layerState,
    selectedShapeLayers: layerState.layers,
    shapeNavigation,
  }
}

export type EditorRenderState = ReturnType<typeof useEditorRenderState>
