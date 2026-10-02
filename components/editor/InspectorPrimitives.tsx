"use client"

import { ChevronRight } from "lucide-react"
import { useId, type ReactNode, type RefObject } from "react"
import { cn } from "@/lib/utils"
import { usePropertyEditScope } from "./PropertyEditScope"

// Single source of truth for inspector layout rhythm. Every property row shares
// one label column width and one control height so columns line up across every
// section (Style / Shape / Transform / Light).
export const INSPECTOR_LABEL_WIDTH = "w-[88px]"

// A section is a FLAT block, not a card — Figma/Framer style. Sections are
// separated by hairline dividers (see InspectorSidebar's `divide-y`) so the panel
// reads as one cohesive surface instead of a stack of floating boxes. When
// `active` (the current timeline target) a quiet 2px accent bar runs down the
// left edge — we never fill the whole group.
export function InspectorSection({
  title,
  action,
  active,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  active?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      data-active={active ? "" : undefined}
      className={cn(
        "relative flex flex-col gap-2 py-3 first:pt-1 last:pb-1",
        className
      )}
    >
      {active ? (
        <span className="pointer-events-none absolute top-2.5 bottom-2.5 -left-1.5 w-0.5 rounded-full bg-foreground/35" />
      ) : null}
      <div className="flex min-h-8 items-center justify-between px-1.5">
        <span
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            active ? "text-foreground/90" : "text-muted-foreground"
          )}
        >
          {{
            STYLE: "Appearance",
            GEOMETRY: "Shape",
            TRANSFORM: "Transform",
            LIGHT: "Lighting",
          }[title] ?? title}
        </span>
        {action}
      </div>
      {children}
    </section>
  )
}

export function InspectorRow({
  label,
  dot,
  labelAction,
  trailing,
  active,
  onClick,
  rowRef,
  className,
  editProperty,
  scopeLabel,
  children,
}: {
  label: ReactNode
  /** color of the keyframe indicator dot, or null/undefined to hide it */
  dot?: string | null
  /** extra control rendered inside the label column (e.g. axis-lock toggle) */
  labelAction?: ReactNode
  /** node rendered after the control (e.g. a per-row keyframe diamond) */
  trailing?: ReactNode
  active?: boolean
  onClick?: () => void
  rowRef?: RefObject<HTMLDivElement | null>
  className?: string
  editProperty?: string
  scopeLabel?: string
  children: ReactNode
}) {
  const scope = usePropertyEditScope(editProperty)
  const scopeId = useId()
  const needsKeyframe = scope?.kind === "animated"
  return (
    <div
      ref={rowRef}
      onClick={onClick}
      onFocusCapture={onClick}
      data-active={active ? "" : undefined}
      data-edit-property={editProperty}
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-1.5 py-1.5 transition-colors",
        onClick && "cursor-pointer hover:bg-foreground/[0.03]",
        active && "bg-foreground/[0.05]",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 text-[13px] font-medium transition-colors duration-100",
          INSPECTOR_LABEL_WIDTH,
          active ? "text-foreground" : "text-foreground/80"
        )}
      >
        <span className="min-w-0 text-pretty">{label}</span>
        {dot ? (
          <span
            className="size-1 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
          />
        ) : null}
        {labelAction}
      </div>
      <fieldset
        disabled={needsKeyframe}
        inert={needsKeyframe ? true : undefined}
        aria-label={editProperty ? `${editProperty} controls` : undefined}
        aria-describedby={scope ? scopeId : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          needsKeyframe && "opacity-65"
        )}
      >
        {children}
      </fieldset>
      {trailing}
      {scope && (
        <div
          className={cn(
            "flex w-full items-center justify-between gap-2 text-xs leading-4",
            scope.kind === "whole" && "sr-only"
          )}
        >
          <span
            id={scopeId}
            title={scope.description}
            className="text-muted-foreground"
          >
            {scopeLabel ? `${scopeLabel}: ` : null}
            {scope.label}
            {needsKeyframe ? ". Enable Auto-key to edit." : null}
          </span>
          {needsKeyframe && (
            <button
              type="button"
              aria-label={`Enable Auto-key to edit ${editProperty} at ${scope.time}s`}
              onClick={(event) => {
                event.stopPropagation()
                scope.enableEditing()
              }}
              className="min-h-8 shrink-0 rounded-md bg-primary/10 px-2 font-medium text-primary hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
            >
              Edit here
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function InspectorDisclosure({
  title,
  open,
  badge,
  onOpenChange,
  children,
}: {
  title: string
  open: boolean
  badge?: ReactNode
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex min-h-10 items-center gap-1.5 rounded-lg px-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <ChevronRight
          className={cn(
            "size-3 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        {title.toLowerCase().replace(/^./, (letter) => letter.toUpperCase())}
        {badge}
      </button>
      {open ? <div className="flex flex-col gap-0.5">{children}</div> : null}
    </div>
  )
}
