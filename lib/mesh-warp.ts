/**
 * Free-form mesh gradients.
 *
 * A mesh blends nine colors as a 3×3 grid. Each node may be dragged to an
 * `x`/`y` (0–1, y down); unmoved nodes sit on the regular grid. Rendering maps
 * a sample point back into the regular grid's coordinates, so a dragged node
 * carries its color with it and the familiar blend stays intact. Meshes with
 * no moved nodes render exactly as before.
 */

export type MeshPoint = { x: number; y: number }

type MaybePositioned = { x?: number; y?: number }

export const MESH_NODE_COUNT = 9

export const defaultMeshPoint = (index: number): MeshPoint => ({
  x: (index % 3) / 2,
  y: Math.floor(index / 3) / 2,
})

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

/** Node positions for the first nine (position-sorted) stops. */
export const meshNodePoints = (stops: MaybePositioned[]): MeshPoint[] =>
  Array.from({ length: MESH_NODE_COUNT }, (_, index) => {
    const fallback = defaultMeshPoint(index)
    const stop = stops.length >= MESH_NODE_COUNT ? stops[index] : undefined
    return {
      x: Number.isFinite(stop?.x) ? clamp01(stop!.x!) : fallback.x,
      y: Number.isFinite(stop?.y) ? clamp01(stop!.y!) : fallback.y,
    }
  })

export const isWarpedMesh = (points: MeshPoint[]) =>
  points.some((point, index) => {
    const fallback = defaultMeshPoint(index)
    return (
      Math.abs(point.x - fallback.x) > 1e-4 ||
      Math.abs(point.y - fallback.y) > 1e-4
    )
  })

/**
 * Where (u, v) falls in the regular grid's coordinates. Each moved node drags
 * the space around it (inverse-distance weighted, so unmoved nodes hold their
 * neighbourhood still). Smooth everywhere and cannot fold, however far a node
 * is dragged; at a node it lands exactly on that node's grid spot.
 */
export const meshWarpCoordinates = (
  points: MeshPoint[],
  u: number,
  v: number
): { s: number; t: number } => {
  let weightSum = 0
  let dx = 0
  let dy = 0
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const home = defaultMeshPoint(index)
    const distanceSquared = (point.x - u) ** 2 + (point.y - v) ** 2
    if (distanceSquared < 1e-10) return { s: home.x, t: home.y }
    const weight = 1 / (distanceSquared * Math.sqrt(distanceSquared))
    weightSum += weight
    dx += weight * (point.x - home.x)
    dy += weight * (point.y - home.y)
  }
  return {
    s: clamp01(u - dx / weightSum),
    t: clamp01(v - dy / weightSum),
  }
}

/** Stops past the nine grid nodes are free points: soft blobs of color. */
export const MESH_EXTRA_RADIUS = 0.2

export const meshExtraPoints = <
  T extends { color: string; x?: number; y?: number },
>(
  stops: T[]
) =>
  stops.slice(MESH_NODE_COUNT).map((stop) => ({
    color: stop.color,
    x: Number.isFinite(stop.x) ? clamp01(stop.x!) : 0.5,
    y: Number.isFinite(stop.y) ? clamp01(stop.y!) : 0.5,
  }))

/** How strongly a free point's color covers (u, v): 1 at its centre. */
export const meshBlobWeight = (point: MeshPoint, u: number, v: number) =>
  Math.exp(
    -((point.x - u) ** 2 + (point.y - v) ** 2) /
      (2 * MESH_EXTRA_RADIUS * MESH_EXTRA_RADIUS)
  )
