"use client"

import React from "react"
import { TimelineLaneBackground } from "./TimelineLaneBackground"
import { TimelinePlayheadLine } from "./TimelineLaneOverlays"
import { TimelinePropertyRows } from "./TimelinePropertyRows"
import { TimelineRuler } from "./TimelineRuler"
import { TimelineShapeLane } from "./TimelineShapeLane"
import { TimelineTrackRows } from "./TimelineTrackRows"
import type { TimelineLanesSurfaceProps } from "./TimelineLanesSurfaceTypes"

export function TimelineLanesSurface({
  viewport,
  shapeLane,
  propertyLane,
  trackLane,
  menu,
}: TimelineLanesSurfaceProps) {
  return (
    <div
      ref={viewport.timelineScrollRef}
      // Native one-finger scrolling in both axes; two fingers belong to pinch zoom.
      className="editor-scrollbar relative min-w-0 flex-1 touch-pan-x touch-pan-y overflow-auto bg-(--timeline-lane)"
      onScroll={(event) =>
        viewport.syncLeftRailScroll(event.currentTarget.scrollTop)
      }
    >
      {/* min-h-full so lanes fill the dock when there are few rows — otherwise a
          blank bg-background slab shows under "Add property". */}
      <div className="flex min-h-full min-w-full">
        <div
          className="relative flex min-h-full shrink-0 flex-col"
          style={{
            width: `${viewport.timelineZoom * 100}%`,
            minWidth: "100%",
          }}
        >
          <TimelineRuler
            ref={viewport.laneRef}
            currentTime={viewport.currentTime}
            duration={viewport.duration}
            ticks={viewport.timelineTicks}
            playheadX={viewport.playheadX}
            onPointerDown={viewport.handleScrubStart}
            onKeyboardTimeChange={(time) => {
              shapeLane.onClearSelectedKeyframe()
              shapeLane.onScrubStart?.()
              shapeLane.onTimeChange(time)
            }}
            onContextMenu={(event) => {
              const time = viewport.timeFromClientX(event.clientX, {
                bypass: event.altKey,
              })
              menu.onOpenContextMenu(event, "Timeline", [
                menu.createGoToMenuItem(event, time),
              ])
            }}
          />

          <div className="relative min-h-0 flex-1">
            <TimelineLaneBackground
              duration={viewport.duration}
              secondGridTicks={viewport.secondGridTicks}
            />
            <TimelineShapeLane
              duration={viewport.duration}
              shapes={shapeLane.shapes}
              sortedShapes={shapeLane.sortedShapes}
              selectedShapeId={shapeLane.selectedShapeId}
              openClipEditor={shapeLane.openClipEditor}
              wipeDirections={shapeLane.wipeDirections}
              transitionWindows={shapeLane.transitionWindows}
              clipBounds={shapeLane.clipBounds}
              shapeDraggedRef={shapeLane.shapeDraggedRef}
              shapeLabel={shapeLane.shapeLabel}
              timeFromClientX={viewport.timeFromClientX}
              onClearSelectedKeyframe={shapeLane.onClearSelectedKeyframe}
              onScrubStart={shapeLane.onScrubStart}
              onTimeChange={shapeLane.onTimeChange}
              onOpenClipEditorChange={shapeLane.onOpenClipEditorChange}
              onShapeBlendChange={shapeLane.onShapeBlendChange}
              onShapeEasingChange={shapeLane.onShapeEasingChange}
              onTransitionEdgeDrag={shapeLane.onTransitionEdgeDrag}
              onSelectShape={shapeLane.onSelectShape}
              onOpenShapePicker={shapeLane.onOpenShapePicker}
              onUploadShape={shapeLane.onUploadShape}
              onMoveShapeOrder={shapeLane.onMoveShapeOrder}
              onRemoveShape={shapeLane.onRemoveShape}
              onShapeDrag={shapeLane.onShapeDrag}
              onOpenContextMenu={menu.onOpenContextMenu}
              createGoToMenuItem={menu.createGoToMenuItem}
              onAddShape={shapeLane.onAddShape}
            />

            <TimelinePropertyRows
              duration={viewport.duration}
              rows={propertyLane.visiblePropertyRows}
              revealedRowId={propertyLane.revealedRowId}
              selectedKeyframe={propertyLane.selectedKeyframe}
              onSelectKeyframe={propertyLane.onSelectKeyframe}
              onOpenKeyframeEditor={propertyLane.onOpenKeyframeEditor}
              onActivePropertyRowChange={propertyLane.onActivePropertyRowChange}
              onRemovePropertyKeyframe={propertyLane.onRemovePropertyKeyframe}
              onAddPropertyKeyframeAtTime={
                propertyLane.onAddPropertyKeyframeAtTime
              }
              onMovePropertyKeyframe={propertyLane.onMovePropertyKeyframe}
              onSetPropertyEasing={propertyLane.onSetPropertyEasing}
              onScrubStart={propertyLane.onScrubStart}
              onTimeChange={propertyLane.onTimeChange}
              timeFromClientX={viewport.timeFromClientX}
              onOpenContextMenu={menu.onOpenContextMenu}
              createGoToMenuItem={menu.createGoToMenuItem}
            />

            <TimelineTrackRows
              duration={viewport.duration}
              tracks={trackLane.tracks}
              revealedRowId={trackLane.revealedRowId}
              activeTrackId={trackLane.activeTrackId}
              selectedKeyframe={trackLane.selectedKeyframe}
              timeEditor={trackLane.timeEditor}
              keyframeTimeClampNotice={trackLane.keyframeTimeClampNotice}
              keyframeDraggedRef={trackLane.keyframeDraggedRef}
              onSelectTrack={trackLane.onSelectTrack}
              onSelectKeyframe={trackLane.onSelectKeyframe}
              onOpenKeyframeEditor={trackLane.onOpenKeyframeEditor}
              onTimeEditorChange={trackLane.onTimeEditorChange}
              onCommitTimeEditor={trackLane.onCommitTimeEditor}
              onScrubStart={trackLane.onScrubStart}
              onTimeChange={trackLane.onTimeChange}
              onAddTrackKeyframeAtTime={trackLane.onAddTrackKeyframeAtTime}
              onRemoveTrackKeyframe={trackLane.onRemoveTrackKeyframe}
              onClearTrackKeyframes={trackLane.onClearTrackKeyframes}
              onSetTrackEasing={trackLane.onSetTrackEasing}
              onSetSingleKeyframeEasing={trackLane.onSetSingleKeyframeEasing}
              onBlockDrag={trackLane.onBlockDrag}
              onKeyframeDrag={trackLane.onKeyframeDrag}
              timeFromClientX={viewport.timeFromClientX}
              onOpenContextMenu={menu.onOpenContextMenu}
              createGoToMenuItem={menu.createGoToMenuItem}
            />
            {/* Keep lane height in sync with the left-rail "Add property" row so
                second-grid lines and the playhead are not cut short by empty bg. */}
            {trackLane.showAddPropertyRow && (
              <div
                className="h-[var(--timeline-property-height)] border-b border-border/60"
                aria-hidden="true"
              />
            )}
          </div>
          <TimelinePlayheadLine playheadX={viewport.playheadX} />
        </div>
      </div>
    </div>
  )
}
