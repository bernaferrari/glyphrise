import { Box2, type Shape, type Vector2 } from "three"

export type SvgLayerPreview = {
  path: string
  viewBox: string
  position: string
}

const coordinate = (value: number) => Number(value.toFixed(3))

const contourPath = (points: Vector2[]) =>
  points.length < 3
    ? ""
    : `M${points.map(({ x, y }) => `${coordinate(x)},${coordinate(y)}`).join("L")}Z`

// Every thumbnail uses the whole icon's bounds, so identical parts remain
// distinguishable by their position. Holes stay attached to their layer.
export const createSvgLayerPreviews = (shapesByPath: Shape[][]) => {
  const bounds = new Box2()
  const layerBounds: Box2[][] = []
  const pathsByShape = shapesByPath.map((shapes, pathIndex) =>
    shapes.map((shape, shapeIndex) => {
      const box = new Box2()
      layerBounds[pathIndex] ??= []
      layerBounds[pathIndex][shapeIndex] = box
      const { shape: outline, holes } = shape.extractPoints(24)
      const contours = [outline, ...holes]
      for (const contour of contours) {
        for (const point of contour) {
          bounds.expandByPoint(point)
          box.expandByPoint(point)
        }
      }
      return contours.map(contourPath).join("")
    })
  )

  let viewBox = "0 0 24 24"
  if (!bounds.isEmpty()) {
    const width = bounds.max.x - bounds.min.x
    const height = bounds.max.y - bounds.min.y
    const padding = Math.max(width, height, 1) * 0.08
    viewBox = [
      bounds.min.x - padding,
      bounds.min.y - padding,
      width + padding * 2,
      height + padding * 2,
    ]
      .map(coordinate)
      .join(" ")
  }

  return pathsByShape.map((paths, pathIndex) =>
    paths.map((path, shapeIndex): SvgLayerPreview => ({
      path,
      viewBox,
      position: layerPosition(layerBounds[pathIndex][shapeIndex], bounds),
    }))
  )
}

const layerPosition = (layer: Box2, icon: Box2) => {
  if (layer.isEmpty() || icon.isEmpty()) return ""
  const width = icon.max.x - icon.min.x
  const height = icon.max.y - icon.min.y
  if (
    layer.max.x - layer.min.x >= width * 0.8 &&
    layer.max.y - layer.min.y >= height * 0.8
  )
    return "Main shape"

  const x = ((layer.min.x + layer.max.x) / 2 - icon.min.x) / (width || 1)
  const y = ((layer.min.y + layer.max.y) / 2 - icon.min.y) / (height || 1)
  const column = x < 1 / 3 ? "left" : x > 2 / 3 ? "right" : "center"
  const row = y < 1 / 3 ? "Top" : y > 2 / 3 ? "Bottom" : "Middle"
  return row === "Middle" && column === "center" ? "Center" : `${row} ${column}`
}
