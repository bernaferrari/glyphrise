"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { TimelineGoToPopover } from "./timeline/TimelineGoToPopover"
import { TimelineLanesSurface } from "./timeline/TimelineLanesSurface"
import { TimelineLeftRailPanel } from "./timeline/TimelineLeftRailPanel"
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

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) setContextMenu(null)
      }}
    >
      <ContextMenuTrigger className="contents">
        <div className="timeline-density flex h-full flex-col overflow-hidden bg-background font-sans select-none">
          {props.motionRecipes?.length && props.onApplyMotionRecipe ? (
            <div className="editor-scrollbar flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-muted/30 px-2 py-1.5 min-[720px]:hidden">
              <span className="flex shrink-0 items-center gap-1 pr-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                <Sparkles aria-hidden="true" className="size-3" />
                Quick motion
              </span>
              {props.motionRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  aria-pressed={props.activeRecipeId === recipe.id}
                  onClick={() => props.onApplyMotionRecipe?.(recipe)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-medium transition-[background-color,color,transform] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.97]",
                    props.activeRecipeId === recipe.id
                      ? "border-primary/35 bg-primary/12 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {recipe.name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <TimelineLeftRailPanel {...leftRailProps} />
            <TimelineLanesSurface {...lanesSurfaceProps} />
          </div>
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
