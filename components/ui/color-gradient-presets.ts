import { defaultMeshPoint, MESH_NODE_COUNT } from "../../lib/mesh-warp"
import { hexToHsv, hsvToHex, type GradientType } from "./color-picker-utils"

export type GradientStop = {
  id?: string
  color: string
  position: number
  x?: number
  y?: number
}

export type GradientPreset = {
  name: string
  type: GradientType
  stops: GradientStop[]
}

/**
 * Mesh presets are authored as a 3×3 grid (top row first). Rows run light to
 * deep so the gradient reinforces the top-lit 3D volume, and neighbours stay
 * within a hue family so blends never pass through grey. Colors render as
 * picked; any saturation or brightness grading belongs to the finish.
 */
const meshStops = (rows: string[][]): GradientStop[] =>
  rows.flat().map((color, index) => ({ color, position: index / 8 }))

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: "Spectrum Mesh",
    type: "mesh",
    stops: meshStops([
      ["#FF9900", "#FF360A", "#D13AB3"],
      ["#FFC700", "#807AFF", "#1759FF"],
      ["#63E600", "#00C796", "#00ADF0"],
    ]),
  },
  {
    name: "Sunset Mesh",
    type: "mesh",
    stops: meshStops([
      ["#FFC857", "#FF8A5B", "#FF5C8A"],
      ["#FF7A45", "#F0457A", "#B44CE0"],
      ["#E8364F", "#9D3BD8", "#5B48F0"],
    ]),
  },
  {
    name: "Ember Mesh",
    type: "mesh",
    stops: meshStops([
      ["#FFE27A", "#FFB547", "#FF8A4A"],
      ["#FFA23D", "#FF6A3D", "#F0466B"],
      ["#FF5A2E", "#D9304F", "#9C2A75"],
    ]),
  },
  {
    name: "Citrus Mesh",
    type: "mesh",
    stops: meshStops([
      ["#FFF27A", "#D9F76A", "#9EF06E"],
      ["#FFC53D", "#B8E84A", "#4FD98A"],
      ["#FF8F2E", "#6CCB3C", "#14B89A"],
    ]),
  },
  {
    name: "Aurora Mesh",
    type: "mesh",
    stops: meshStops([
      ["#B4FF8A", "#4FF0C0", "#56C8FF"],
      ["#3EE07A", "#22C6C8", "#5A7CFF"],
      ["#14B88A", "#2A8BE8", "#8B5CF6"],
    ]),
  },
  {
    name: "Lagoon Mesh",
    type: "mesh",
    stops: meshStops([
      ["#7CF5E4", "#5AD8FF", "#7FA6FF"],
      ["#22D3B4", "#2BAEF0", "#5B6CFF"],
      ["#0FA89A", "#1478D8", "#3B3FD0"],
    ]),
  },
  {
    name: "Orchid Mesh",
    type: "mesh",
    stops: meshStops([
      ["#FFB2E4", "#E09BFF", "#AFA4FF"],
      ["#FF5FB8", "#B860FF", "#7480FF"],
      ["#D6338F", "#7E3FE6", "#3F55EE"],
    ]),
  },
  {
    name: "Blush Mesh",
    type: "mesh",
    stops: meshStops([
      ["#FFD8A8", "#FFB8C6", "#E2B6FF"],
      ["#FF9E7A", "#FF7EB0", "#B98CFF"],
      ["#FF6F6F", "#F25AA5", "#8E6CFF"],
    ]),
  },
]

export const shuffledMeshColors = (stops: GradientStop[]): GradientStop[] => {
  const palette =
    stops.length >= 9
      ? stops
      : GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)]
          .stops
  const offset = Math.floor(Math.random() * palette.length)
  const hueShift = Math.floor(24 + Math.random() * 96)
  const shouldShiftHue = Math.random() > 0.35

  return stops.map((stop, index) => {
    const source = palette[(index + offset) % palette.length] ?? stop
    const hsv = hexToHsv(source.color)
    return {
      ...stop,
      color: shouldShiftHue
        ? hsvToHex((hsv.h + hueShift) % 360, hsv.s, hsv.v)
        : source.color,
    }
  })
}

const MESH_JITTER = 0.16

/** Nudges every mesh node off its grid spot for an organic, warped blend. */
export const shuffledMeshPositions = (stops: GradientStop[]): GradientStop[] =>
  stops.map((stop, index) => {
    if (index >= MESH_NODE_COUNT) return stop
    const home = defaultMeshPoint(index)
    const jitter = () => (Math.random() * 2 - 1) * MESH_JITTER
    return {
      ...stop,
      x: Math.max(0, Math.min(1, home.x + jitter())),
      y: Math.max(0, Math.min(1, home.y + jitter())),
    }
  })
