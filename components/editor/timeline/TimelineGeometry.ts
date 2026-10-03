// Leave space for the full 44px endpoint keyframe target.
export const EDGE_INSET = 24
export const SNAP_THRESHOLD_SECONDS = 0.08
export const PLAYHEAD_SNAP_THRESHOLD_SECONDS = 0.06
export const SECOND_SNAP_THRESHOLD_SECONDS = 0.035
export const TIMELINE_ZOOM_MIN = 1
export const TIMELINE_ZOOM_MAX = 3
export const TIMELINE_ZOOM_STEP = 0.25
export const TIMELINE_FRAME_RATE = 60
export const TIMELINE_EDGE_SCROLL_ZONE = 44
export const TIMELINE_EDGE_SCROLL_MAX = 14

export const xForFrac = (frac: number, offsetPx = 0) =>
  `calc(${EDGE_INSET}px + (100% - ${EDGE_INSET * 2}px) * ${frac}${offsetPx ? ` + ${offsetPx}px` : ""})`

export const widthForSpan = (span: number) =>
  `calc((100% - ${EDGE_INSET * 2}px) * ${span})`

export const formatTimelineTick = (time: number) =>
  `${Number(time.toFixed(2))}s`

/** Editor timecode, e.g. 0:01.25 — minutes, seconds, hundredths. */
export const formatTimecode = (time: number) => {
  const safe = Math.max(0, time)
  const minutes = Math.floor(safe / 60)
  const seconds = safe - minutes * 60
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`
}

const MAJOR_TICK_STEPS = [0.1, 0.25, 0.5, 1, 2, 5, 10]

export const createTimelineTicks = ({
  duration,
  timelineZoom,
  frameSnapActive,
}: {
  duration: number
  timelineZoom: number
  frameSnapActive: boolean
}) => {
  // Aim for roughly eight labelled ticks across the visible lane.
  const visibleSeconds = duration / Math.max(timelineZoom, 0.001)
  const majorTickStep =
    MAJOR_TICK_STEPS.find((step) => step >= visibleSeconds / 8) ?? 10
  const minorTickStep = frameSnapActive
    ? 1 / TIMELINE_FRAME_RATE
    : majorTickStep / (majorTickStep === 1 || majorTickStep === 2 ? 4 : 5)
  const tickCount = Math.floor(duration / minorTickStep) + 1

  return Array.from({ length: tickCount }, (_, index) => {
    const rawTime = Number((index * minorTickStep).toFixed(3))
    const time = index === tickCount - 1 ? Math.min(rawTime, duration) : rawTime
    const major =
      Math.abs(time / majorTickStep - Math.round(time / majorTickStep)) < 0.001
    return { time, major }
  }).filter((tick) => tick.time <= duration + 0.001)
}

export const createSecondGridTicks = (duration: number) =>
  Array.from({ length: Math.floor(duration) + 1 }, (_, index) => index).filter(
    (time) => time > 0 && time < duration
  )

export type TimelineViewportGeometry = {
  laneLeft: number
  laneWidth: number
  usableWidth: number
  viewportLeft: number
  viewportRight: number
}

export const clampClientXToTimelineViewport = (
  clientX: number,
  geometry: TimelineViewportGeometry
) =>
  Math.max(
    geometry.viewportLeft + EDGE_INSET,
    Math.min(geometry.viewportRight - EDGE_INSET, clientX)
  )

export const rawTimeFromTimelineClientX = ({
  clientX,
  duration,
  geometry,
  clampToViewport = false,
}: {
  clientX: number
  duration: number
  geometry: TimelineViewportGeometry
  clampToViewport?: boolean
}) => {
  const effectiveClientX = clampToViewport
    ? clampClientXToTimelineViewport(clientX, geometry)
    : clientX
  const x = Math.max(
    0,
    Math.min(
      effectiveClientX - geometry.laneLeft - EDGE_INSET,
      geometry.usableWidth
    )
  )
  return Number(((x / geometry.usableWidth) * duration).toFixed(3))
}

export const quantizeTimeToFrame = (time: number) =>
  Number(
    (Math.round(time * TIMELINE_FRAME_RATE) / TIMELINE_FRAME_RATE).toFixed(3)
  )

export const parseTimelineTimeInput = (value: string) => {
  const cleaned = value.trim().toLowerCase().replace(/s$/, "").replace(",", ".")
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":").map((part) => Number.parseFloat(part))
    if (parts.some((part) => !Number.isFinite(part))) return Number.NaN
    return parts.reduce((total, part) => total * 60 + part, 0)
  }
  return Number.parseFloat(cleaned)
}

export const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    )
  )
