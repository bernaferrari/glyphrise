"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimelineShapePicker } from "./timeline/TimelineShapePicker"
import { TimelineKeyframeList } from "./timeline/TimelineKeyframeList"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { TimelineGoToPopover } from "./timeline/TimelineGoToPopover"
import { TimelineLanesSurface } from "./timeline/TimelineLanesSurface"
import { TimelineLeftRailPanel } from "./timeline/TimelineLeftRailPanel"
import { TimelineHeader } from "./timeline/TimelineHeader"
import { TimelineZoomControls } from "./timeline/TimelineZoomControls"
import { TimelineContextMenu } from "./timeline/TimelineMenus"
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

export const Timeline: React.FC<TimelineProps> = (props) => {
  const {
    contextMenu,
    setContextMenu,
    goToPopoverProps,
    leftRailProps,
    lanesSurfaceProps,
  } = useTimelineController(props)

  const [viewOverride, setViewOverride] = React.useState<string | null>(null)
  const view = viewOverride ?? "keyframes"

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) setContextMenu(null)
      }}
    >
      <ContextMenuTrigger className="contents">
        <div className="timeline-density flex h-full flex-col overflow-hidden bg-background font-sans select-none">
          <Tabs
            value={view}
            onValueChange={setViewOverride}
            className="min-h-0 flex-1 gap-0"
          >
            <div className="flex shrink-0 items-stretch">
              <TabsList
                aria-label="Animation editing view"
                className="w-36 shrink-0 rounded-none border-b border-border bg-background p-1 group-data-horizontal/tabs:h-auto min-[720px]:w-48"
              >
                <TabsTrigger value="timeline" className="min-h-11 text-xs">
                  Sequence
                </TabsTrigger>
                <TabsTrigger value="keyframes" className="min-h-11 text-xs">
                  Motion
                </TabsTrigger>
              </TabsList>
              <TimelineHeader
                {...leftRailProps}
                compactMode={props.compactMode || view === "keyframes"}
                showSnap={view === "timeline"}
                isPlaying={props.isPlaying}
                onPlayToggle={
                  props.compactMode ? undefined : props.onPlayToggle
                }
              />
            </div>
            <TabsContent
              value="timeline"
              className="flex min-h-0 flex-col overflow-hidden"
            >
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <TimelineLeftRailPanel {...leftRailProps} />
                <TimelineLanesSurface {...lanesSurfaceProps} />
              </div>
              <TimelineZoomControls
                zoom={lanesSurfaceProps.viewport.timelineZoom}
                onAdjustZoom={lanesSurfaceProps.viewport.onAdjustTimelineZoom}
                onFitTimeline={lanesSurfaceProps.viewport.onFitTimeline}
              />
            </TabsContent>
            <TabsContent
              value="keyframes"
              className="flex min-h-0 overflow-hidden"
            >
              <TimelineKeyframeList
                motionPresets={props.motionPresets}
                surface={lanesSurfaceProps}
                duration={props.duration}
                tracks={props.tracks}
                hiddenTracks={leftRailProps.hiddenTracks}
                onAddProperty={leftRailProps.onAddProperty}
                onTracksChange={props.onTracksChange}
                onEditValue={props.onEditKeyframeValue}
                renderPropertyValueEditor={props.renderPropertyValueEditor}
              />
            </TabsContent>
          </Tabs>
          <TimelineShapePicker {...lanesSurfaceProps.shapeLane} />
          <TimelineGoToPopover {...goToPopoverProps} />
        </div>
      </ContextMenuTrigger>
      <TimelineContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    </ContextMenu>
  )
}
