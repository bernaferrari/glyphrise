import * as THREE from "three"

export type DiagonalWipeDirection = {
  x: number
  y: number
}

export type DiagonalWipePlaneResult = {
  basePlane: THREE.Plane
  wipedPlane: THREE.Plane
  boundaryStart: THREE.Vector2
  boundaryEnd: THREE.Vector2
}

const EPSILON = 0.0001

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const wipeAxis = (direction: DiagonalWipeDirection) => {
  const length = Math.hypot(direction.x, direction.y)
  if (length < EPSILON) return new THREE.Vector2(1, 0)
  return new THREE.Vector2(direction.x / length, direction.y / length)
}

const wipeTravelRange = (
  width: number,
  height: number,
  axis: THREE.Vector2
) => {
  const halfWidth = width * 0.5
  const halfHeight = height * 0.5
  const corners = [
    new THREE.Vector2(-halfWidth, -halfHeight),
    new THREE.Vector2(halfWidth, -halfHeight),
    new THREE.Vector2(halfWidth, halfHeight),
    new THREE.Vector2(-halfWidth, halfHeight),
  ]
  const values = corners.map((corner) => axis.dot(corner))
  const min = Math.min(...values)
  const max = Math.max(...values)
  return {
    min,
    max,
    distance: Math.max(1, max - min),
  }
}

const boundaryLineForThreshold = (
  width: number,
  height: number,
  axis: THREE.Vector2,
  threshold: number
) => {
  const halfWidth = width * 0.5
  const halfHeight = height * 0.5
  const points: THREE.Vector2[] = []

  const addIfInBounds = (point: THREE.Vector2) => {
    const inBounds =
      point.x >= -halfWidth - EPSILON &&
      point.x <= halfWidth + EPSILON &&
      point.y >= -halfHeight - EPSILON &&
      point.y <= halfHeight + EPSILON
    if (!inBounds) return
    if (points.some((candidate) => candidate.distanceToSquared(point) < 0.0001))
      return
    points.push(point)
  }

  if (Math.abs(axis.y) > EPSILON) {
    addIfInBounds(
      new THREE.Vector2(-halfWidth, (threshold - axis.x * -halfWidth) / axis.y)
    )
    addIfInBounds(
      new THREE.Vector2(halfWidth, (threshold - axis.x * halfWidth) / axis.y)
    )
  }
  if (Math.abs(axis.x) > EPSILON) {
    addIfInBounds(
      new THREE.Vector2(
        (threshold - axis.y * -halfHeight) / axis.x,
        -halfHeight
      )
    )
    addIfInBounds(
      new THREE.Vector2((threshold - axis.y * halfHeight) / axis.x, halfHeight)
    )
  }

  if (points.length < 2) {
    return {
      start: new THREE.Vector2(),
      end: new THREE.Vector2(),
    }
  }

  let start = points[0]
  let end = points[1]
  let bestDistance = start.distanceToSquared(end)
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const distance = points[i].distanceToSquared(points[j])
      if (distance > bestDistance) {
        bestDistance = distance
        start = points[i]
        end = points[j]
      }
    }
  }

  return { start, end }
}

export const createDiagonalWipePlanes = ({
  width,
  height,
  progress,
  direction,
  seamOverlap = 0,
}: {
  width: number
  height: number
  progress: number
  direction: DiagonalWipeDirection
  seamOverlap?: number
}): DiagonalWipePlaneResult => {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const axis = wipeAxis(direction)
  const range = wipeTravelRange(safeWidth, safeHeight, axis)
  const threshold = range.max - range.distance * clamp01(progress)
  const seam = Math.max(0, seamOverlap)

  const baseNormal = new THREE.Vector3(-axis.x, -axis.y, 0)
  const wipedNormal = new THREE.Vector3(axis.x, axis.y, 0)
  const boundary = boundaryLineForThreshold(
    safeWidth,
    safeHeight,
    axis,
    threshold
  )

  return {
    basePlane: new THREE.Plane(baseNormal, threshold + seam),
    wipedPlane: new THREE.Plane(wipedNormal, -threshold + seam),
    boundaryStart: boundary.start,
    boundaryEnd: boundary.end,
  }
}
