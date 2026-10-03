"use client"

import React from "react"
import { TimelineShapePicker } from "./timeline/TimelineShapePicker"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { TimelineGoToPopover } from "./timeline/TimelineGoToPopover"
import { TimelineLanesSurface } from "./timeline/TimelineLanesSurface"
import { TimelineLeftRailPanel } from "./timeline/TimelineLeftRailPanel"
import { TimelineToolbar } from "./timeline/TimelineToolbar"
import { TimelineClipPanel } from "./timeline/TimelineClipPanel"
import { TimelineContextMenu } from "./timeline/TimelineMenus"
import { TimelineSelectedKeyframeEditor } from "./timeline/TimelineSelectedKeyframeEditor"
import type { TimelineProps } from "./timeline/TimelineTypes"
import { useTimelineController } from "./timeline/useTimelineController"

export {
  applyEasing,
  DEFAULT_TRANSITION_END,
  DEFAULT_TRANSITION_START,
  interpolateFillKeyframes,
  interpolateKeyframes,
  type EasingType,
  type FillGradientType,
  type FillKeyframe,
  type FillStop,
  type Keyframe,
  type ShapeStop,
  type TimelinePropertyRow,
  type TimelineTrack,
} from "./TimelineModel"
export type {
  ShapeOption,
  TimelineProps,
  WipeDirectionOption,
} from "./timeline/TimelineTypes"

/**
 * One timeline for everything that changes over time: the icon track (which
 * icon shows when, and how it transitions) and one lane per animated
 * property. Transport, recording, and view controls live in its toolbar.
 */
export const Timeline: React.FC<TimelineProps> = (props) => {
  const {
    contextMenu,
    setContextMenu,
    goToPopoverProps,
    toolbarProps,
    leftRailProps,
    lanesSurfaceProps,
    keyframeEditorProps,
    clipPanelProps,
  } = useTimelineController(props)

  return (
    <ContextMenu
      // Controlled: the menu opens only where a target supplied its items,
      // anchored at the pointer, never at a stale or default position.
      open={contextMenu !== null}
      onOpenChange={(open) => {
        if (!open) setContextMenu(null)
      }}
    >
      <ContextMenuTrigger className="contents">
        <div className="timeline-density flex h-full flex-col overflow-hidden bg-(--timeline-lane) font-sans select-none">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <TimelineLeftRailPanel
              {...leftRailProps}
              header={<TimelineToolbar {...toolbarProps} />}
            />
            <TimelineLanesSurface {...lanesSurfaceProps} />
          </div>
          <TimelineShapePicker {...lanesSurfaceProps.shapeLane} />
          <TimelineGoToPopover {...goToPopoverProps} />
          <TimelineClipPanel {...clipPanelProps} />
          <TimelineSelectedKeyframeEditor
            {...keyframeEditorProps}
            renderPropertyValueEditor={props.renderPropertyValueEditor}
            onEditValue={props.onEditKeyframeValue}
          />
        </div>
      </ContextMenuTrigger>
      <TimelineContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    </ContextMenu>
  )
}
