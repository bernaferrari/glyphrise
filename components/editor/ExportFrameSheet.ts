import type { ExportRenderOptions, SvgCanvasProps } from "../3d/SvgTypes"

/** How frames are arranged: best fit, one filmstrip row, or one column. */
export type FrameSheetArrangement = "auto" | "row" | "column"

export type FrameSheetSettings = {
  /** Frames in the image; 1 is a single still. */
  frames: number
  frameArrangement: FrameSheetArrangement
}

export const FRAME_COUNT_PRESETS = [4, 8, 12, 16, 24] as const
export const MAX_SHEET_FRAMES = 64

const MIN_CELL = 64

/**
 * Columns for "auto": the grid whose cells are closest to square (icons are
 * square) in the chosen image size, preferring fewer empty cells.
 */
const autoColumns = (count: number, width: number, height: number) => {
  let best = 1
  let bestScore = Infinity
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns)
    const cellAspect = width / columns / (height / rows)
    const empty = columns * rows - count
    const score = Math.abs(Math.log(cellAspect)) + (empty / count) * 0.5
    if (score < bestScore - 1e-9) {
      best = columns
      bestScore = score
    }
  }
  return best
}

/**
 * The image keeps the chosen size and each frame gets an equal cell, so a
 * 16:9 sheet stays 16:9 whatever the arrangement.
 */
export const frameSheetLayout = (
  { frames, frameArrangement }: FrameSheetSettings,
  size: { width: number; height: number }
) => {
  const count = Math.max(1, Math.min(MAX_SHEET_FRAMES, Math.round(frames)))
  const columns =
    frameArrangement === "row"
      ? count
      : frameArrangement === "column"
        ? 1
        : autoColumns(count, size.width, size.height)
  const rows = Math.ceil(count / columns)
  const cellWidth = Math.max(MIN_CELL, Math.floor(size.width / columns))
  const cellHeight = Math.max(MIN_CELL, Math.floor(size.height / rows))
  return {
    count,
    columns,
    rows,
    cellWidth,
    cellHeight,
    width: cellWidth * columns,
    height: cellHeight * rows,
  }
}

/**
 * Evenly spaced through one loop, without the end frame: on a looping
 * animation it repeats the first, and sprite players (CSS `steps()`) would
 * show it twice.
 */
export const frameSheetTimes = (count: number, duration: number) =>
  Array.from({ length: count }, (_, index) => (index * duration) / count)

type FrameRenderer = {
  prepareExportRender: (options: ExportRenderOptions) => void
  renderExportFrame: (props: SvgCanvasProps) => Promise<HTMLCanvasElement>
  restorePreviewRender: () => void
}

/** Renders every frame through the export path and tiles them row by row. */
export const renderFrameSheet = async ({
  canvas,
  sheet: sheetSettings,
  options,
  duration,
  evaluateFrame,
}: {
  canvas: FrameRenderer
  sheet: FrameSheetSettings
  options: ExportRenderOptions
  duration: number
  evaluateFrame: (time: number) => SvgCanvasProps
}): Promise<Blob> => {
  const layout = frameSheetLayout(sheetSettings, options)
  const sheet = document.createElement("canvas")
  sheet.width = layout.width
  sheet.height = layout.height
  const context = sheet.getContext("2d")
  if (!context) throw new Error("The browser could not create the image.")
  // Cells left over in the last row share the sheet's background.
  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor
    context.fillRect(0, 0, sheet.width, sheet.height)
  }

  canvas.prepareExportRender({
    width: layout.cellWidth,
    height: layout.cellHeight,
    backgroundColor: options.backgroundColor,
  })
  try {
    const times = frameSheetTimes(layout.count, duration)
    for (const [index, time] of times.entries()) {
      // The renderer reuses one capture canvas, so copy each frame right away.
      const frame = await canvas.renderExportFrame(evaluateFrame(time))
      context.drawImage(
        frame,
        (index % layout.columns) * layout.cellWidth,
        Math.floor(index / layout.columns) * layout.cellHeight,
        layout.cellWidth,
        layout.cellHeight
      )
    }
  } finally {
    canvas.restorePreviewRender()
  }

  return new Promise<Blob>((resolve, reject) =>
    sheet.toBlob(
      (blob) =>
        blob && blob.size > 0
          ? resolve(blob)
          : reject(new Error("The browser could not create the PNG.")),
      "image/png"
    )
  )
}
