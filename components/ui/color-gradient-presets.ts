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

type MeshDesign = {
  /** Grid nodes pulled off their spot, by index (top row first). */
  move?: Record<number, [number, number]>
  /** Free points layered on top: soft blobs of color at (x, y). */
  blobs?: Array<[string, number, number]>
}

/**
 * Mesh presets start from a 3×3 grid of colors (top row first). Each one
 * then bends that grid — sliding edge nodes and the centre far off their
 * spots — so colors flow in curves and no two presets share a shape. A free
 * blob is used only where it reads as a glow, like Sunset's sun. Neighbours stay
 * close in hue so blends never turn grey; light and deep looks alternate.
 * Colors render as picked; any grading belongs to the finish.
 */
const meshStops = (
  rows: string[][],
  { move = {}, blobs = [] }: MeshDesign = {}
): GradientStop[] => [
  ...rows.flat().map((color, index) => {
    const [x, y] = move[index] ?? [
      defaultMeshPoint(index).x,
      defaultMeshPoint(index).y,
    ]
    return { color, position: index / 8, x, y }
  }),
  // Free points come after the nine nodes, like ones added in the editor.
  ...blobs.map(([color, x, y]) => ({ color, position: 1, x, y })),
]

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    // Google's red, yellow, green and blue swirling around a light core.
    name: "Doodle Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#EA4335", "#FA7B17", "#FBBC05"],
        ["#A142F4", "#E8F0FE", "#9BD770"],
        ["#4285F4", "#12B5CB", "#34A853"],
      ],
      {
        move: {
          1: [0.78, 0],
          3: [0, 0.22],
          4: [0.3, 0.66],
          5: [1, 0.8],
          7: [0.22, 1],
        },
      }
    ),
  },
  {
    // The welcome screen's palette: lemon, bubblegum and sky.
    name: "Candy Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#FFF7AD", "#FF8BC7", "#C9A7FF"],
        ["#FFB86B", "#FF4FA3", "#8B6DFF"],
        ["#62EAD9", "#29C7FF", "#6E7BFF"],
      ],
      {
        move: {
          1: [0.22, 0],
          3: [0, 0.8],
          4: [0.7, 0.66],
          5: [1, 0.22],
          7: [0.78, 1],
        },
      }
    ),
  },
  {
    // A golden sun sinking through a lavender sky into coral.
    name: "Sunset Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#A9B4FF", "#C9B8FF", "#FFC6A8"],
        ["#FFB36B", "#FFD23F", "#FF8A5C"],
        ["#F2545B", "#FF6A3D", "#E0457A"],
      ],
      {
        move: {
          1: [0.5, 0],
          3: [0, 0.7],
          4: [0.66, 0.3],
          5: [1, 0.62],
          7: [0.3, 1],
        },
        blobs: [["#FFE36B", 0.5, 0.5]],
      }
    ),
  },
  {
    // Candy pink, peach and lilac blown into a bubble.
    name: "Bubblegum Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#FC9CCC", "#FCA49C", "#FCDC9C"],
        ["#DC7EFC", "#FC7ED2", "#FC7E88"],
        ["#9C9BFF", "#BA60FB", "#FB60E1"],
      ],
      {
        move: {
          1: [0.62, 0],
          3: [0, 0.6],
          4: [0.36, 0.36],
          5: [1, 0.3],
          7: [0.42, 1],
        },
      }
    ),
  },
  {
    // Deep teal lit by an aqua core and a lime corner.
    name: "Neon Lagoon Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#0E7C86", "#3DF5E0", "#B6FF5C"],
        ["#14A7A0", "#5CF2FF", "#1FC8C8"],
        ["#2AA8D8", "#0E8F8F", "#2E9BE0"],
      ],
      {
        move: {
          1: [0.3, 0],
          3: [0, 0.36],
          4: [0.62, 0.7],
          5: [1, 0.7],
          7: [0.6, 1],
        },
      }
    ),
  },
  {
    // Watermelon, mango and lime splashed together.
    name: "Fruit Punch Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#FF6F91", "#FFC75F", "#F9F871"],
        ["#FF9671", "#FF4F79", "#9BDE7E"],
        ["#D65DB1", "#FF8066", "#3DBE8E"],
      ],
      {
        move: {
          1: [0.78, 0],
          3: [0, 0.22],
          4: [0.3, 0.66],
          5: [1, 0.8],
          7: [0.22, 1],
        },
      }
    ),
  },
  {
    // Blue ice folding over itself, light and deep.
    name: "Glacier Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#5B8CFF", "#1F3FD0", "#7FE7FF"],
        ["#2A9DF4", "#E6FBFF", "#3550E8"],
        ["#8FA8FF", "#1E6FE8", "#39C6F0"],
      ],
      {
        move: {
          1: [0.5, 0],
          3: [0, 0.7],
          4: [0.66, 0.3],
          5: [1, 0.62],
          7: [0.3, 1],
        },
      }
    ),
  },
  {
    // Strawberry, lemon and mint swirled around a mango heart.
    name: "Sorbet Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#FFD1E8", "#FFE9A8", "#C8F7D0"],
        ["#FF9CC9", "#FFB65C", "#8FE8C4"],
        ["#FF7BAC", "#FF9A6B", "#4FD1C5"],
      ],
      {
        move: {
          1: [0.3, 0],
          3: [0, 0.36],
          4: [0.62, 0.7],
          5: [1, 0.7],
          7: [0.6, 1],
        },
      }
    ),
  },
  {
    // Firelight rising: honey flames over a berry ember.
    name: "Ember Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#FFE680", "#FFB547", "#FF8A4A"],
        ["#FFA43A", "#FF5F3A", "#F2436E"],
        ["#FF4F2A", "#D62B55", "#8E2A86"],
      ],
      {
        move: {
          1: [0.22, 0],
          3: [0, 0.8],
          4: [0.7, 0.66],
          5: [1, 0.22],
          7: [0.78, 1],
        },
      }
    ),
  },
  {
    // A sunny core blooming into sky, rose and mint.
    name: "Daydream Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#8FD8FF", "#FFE9A0", "#FFB3D9"],
        ["#FFD1A1", "#FFF27A", "#FFC2E0"],
        ["#B8F0D0", "#FFE0A0", "#C8B8FF"],
      ],
      {
        move: {
          1: [0.62, 0],
          3: [0, 0.6],
          4: [0.36, 0.36],
          5: [1, 0.3],
          7: [0.42, 1],
        },
      }
    ),
  },
  {
    // Peach and pink glows popping on deep raspberry.
    name: "Berry Pop Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#B0156A", "#FF6FA8", "#7A1F8C"],
        ["#FF8A6B", "#D61F69", "#FF6FA8"],
        ["#7A1F8C", "#B0156A", "#E83A8C"],
      ],
      {
        move: {
          1: [0.3, 0],
          3: [0, 0.36],
          4: [0.62, 0.7],
          5: [1, 0.7],
          7: [0.6, 1],
        },
      }
    ),
  },
  {
    // Orchid, aqua and mint rippling like shallow water.
    name: "Mermaid Mesh",
    type: "mesh",
    stops: meshStops(
      [
        ["#C8FFE0", "#F197FF", "#9EEBFF"],
        ["#5BFF90", "#4FE0E8", "#F197FF"],
        ["#3ED4D9", "#7FE8C0", "#6FB8FF"],
      ],
      {
        move: {
          1: [0.78, 0],
          3: [0, 0.22],
          4: [0.3, 0.66],
          5: [1, 0.8],
          7: [0.22, 1],
        },
      }
    ),
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
