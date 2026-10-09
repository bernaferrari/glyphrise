"use client"

import { ChevronRight } from "lucide-react"
import { useId, type ReactNode, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePropertyEditScope } from "./PropertyEditScope"

// Single source of truth for inspector layout rhythm. Every property row shares
// one label column width and one control height so columns line up across every
// section (Style / Shape / Transform / Light).
export const INSPECTOR_LABEL_WIDTH = "w-21"

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
      className={cn("relative flex flex-col gap-1", className)}
    >
      <div className="flex min-h-8 items-center justify-between pl-1.5">
        <span className="text-xs font-semibold text-foreground">
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

function PropertyKeyframeIndicator({
  scope,
  property,
}: {
  scope: NonNullable<ReturnType<typeof usePropertyEditScope>>
  property?: string
}) {
  const diamond = (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-2.5 shrink-0">
      <title>{scope.label}</title>
      <rect
        x="4"
        y="4"
        width="8"
        height="8"
        rx="1.2"
        transform="rotate(45 8 8)"
        strokeWidth="2"
        // One keyframe accent everywhere; var() needs style, not attrs.
        className="fill-(--shape-fill) stroke-(--shape-stroke)"
        style={
          {
            "--shape-fill":
              scope.kind === "keyframe" ? "var(--timeline-accent)" : "none",
            // Not animated yet: a quiet stopwatch, as in After Effects.
            "--shape-stroke":
              scope.kind === "whole"
                ? "var(--muted-foreground)"
                : "var(--timeline-accent)",
          } as React.CSSProperties
        }
      />
    </svg>
  )
  if (!scope.onToggle) return diamond
  const label = `${scope.kind === "keyframe" ? "Remove" : "Add"} ${property} keyframe at ${scope.time}s`
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="-mx-1.5"
      aria-label={label}
      title={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        scope.onToggle?.()
      }}
    >
      {diamond}
    </Button>
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
  return (
    <div
      ref={rowRef}
      onClick={onClick}
      onFocusCapture={onClick}
      data-active={active ? "" : undefined}
      data-edit-property={editProperty}
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-1.5 py-0.5 transition-colors",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-xs transition-colors duration-100",
          INSPECTOR_LABEL_WIDTH,
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="min-w-0 text-pretty">{label}</span>
        {scope && (scope.kind !== "whole" || scope.onToggle) ? (
          // The property's stopwatch: hollow and quiet until animated, then
          // accented, and filled when the playhead sits on a keyframe.
          <PropertyKeyframeIndicator scope={scope} property={editProperty} />
        ) : dot ? (
          <span className="size-1 shrink-0 rounded-full bg-(--timeline-accent)" />
        ) : null}
        {labelAction}
      </div>
      <fieldset
        aria-label={editProperty ? `${editProperty} controls` : undefined}
        aria-describedby={scope ? scopeId : undefined}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {children}
      </fieldset>
      {trailing}
      {/* State lives in the diamond; the words are for screen readers. */}
      {scope && (
        <span id={scopeId} className="sr-only">
          {scopeLabel ? `${scopeLabel}: ` : null}
          {scope.label}. {scope.description}
        </span>
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
        className="flex min-h-8 items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
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
