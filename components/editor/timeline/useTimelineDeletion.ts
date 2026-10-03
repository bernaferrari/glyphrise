import { useEffect } from "react"
import { useLatestRef } from "@/lib/use-latest-ref"
import type {
  ShapeStop,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"
import { isEditableTarget } from "./TimelineGeometry"

type TimelineDeletionOptions = {
  selectedKeyframe: SelectedTimelineKeyframe
  /** "property:<id>" or "track:<id>" when a whole row is selected. */
  selectedRow: string | null
  clipSelected: boolean
  onClearPropertyRow?: (rowId: string) => void
  onClearTrackKeyframes?: (trackId: string) => void
  selectedShapeId: string | null
  shapes: ShapeStop[]
  tracks: TimelineTrack[]
  propertyRows: TimelinePropertyRow[]
  onClearSelection: () => void
  onRemoveShape: (shapeId: string) => void
  onRemoveTrackKeyframe: (trackId: string, keyframeId: string) => void
  onRemovePropertyKeyframe?: (rowId: string, keyframeId: string) => void
}

export const useTimelineDeletion = ({
  selectedKeyframe,
  selectedRow,
  clipSelected,
  onClearPropertyRow,
  onClearTrackKeyframes,
  selectedShapeId,
  shapes,
  onRemoveShape,
  tracks,
  propertyRows,
  onClearSelection,
  onRemoveTrackKeyframe,
  onRemovePropertyKeyframe,
}: TimelineDeletionOptions) => {
  const optionsRef = useLatestRef({
    selectedKeyframe,
    selectedRow,
    clipSelected,
    onClearPropertyRow,
    onClearTrackKeyframes,
    selectedShapeId,
    shapes,
    onRemoveShape,
    tracks,
    propertyRows,
    onClearSelection,
    onRemoveTrackKeyframe,
    onRemovePropertyKeyframe,
  })

  useEffect(() => {
    const handleDeleteSelectedKeyframe = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key !== "Delete" && event.key !== "Backspace") return
      if (isEditableTarget(event.target)) return

      const {
        selectedKeyframe,
        tracks,
        propertyRows,
        onClearSelection,
        onRemoveTrackKeyframe,
        onRemovePropertyKeyframe,
      } = optionsRef.current

      if (!selectedKeyframe) {
        const options = optionsRef.current
        if (options.selectedRow) {
          const [kind, id] = options.selectedRow.split(":")
          event.preventDefault()
          options.onClearSelection()
          if (kind === "property") options.onClearPropertyRow?.(id)
          else options.onClearTrackKeyframes?.(id)
          return
        }
        if (
          options.clipSelected &&
          options.selectedShapeId &&
          options.shapes.length > 1
        ) {
          event.preventDefault()
          options.onClearSelection()
          options.onRemoveShape(options.selectedShapeId)
        }
        return
      }

      if (selectedKeyframe.type === "track") {
        const track = tracks.find(
          (item) => item.id === selectedKeyframe.trackId
        )
        if (
          !track?.keyframes.some(
            (keyframe) => keyframe.id === selectedKeyframe.kfId
          )
        )
          return
        event.preventDefault()
        onRemoveTrackKeyframe(selectedKeyframe.trackId, selectedKeyframe.kfId)
        return
      }

      const row = propertyRows.find(
        (item) => item.id === selectedKeyframe.rowId
      )
      if (
        !row?.keyframes.some(
          (keyframe) => keyframe.id === selectedKeyframe.kfId
        )
      )
        return
      event.preventDefault()
      onClearSelection()
      onRemovePropertyKeyframe?.(selectedKeyframe.rowId, selectedKeyframe.kfId)
    }

    window.addEventListener("keydown", handleDeleteSelectedKeyframe)
    return () =>
      window.removeEventListener("keydown", handleDeleteSelectedKeyframe)
  }, [])
}
