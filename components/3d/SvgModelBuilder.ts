import * as THREE from "three"
import { gradientStopsFromFill } from "./SvgColor"
import {
  ICON_VIEWBOX_SIZE,
  SVG_PATH_LAYER_GAP_MIN,
  SVG_PATH_LAYER_GAP_RATIO,
  GLYPHRISE_SLASH_DEPTH_RATIO,
  applySvgModelScale,
} from "./SvgSceneUtils"
import { applyIconGradientUvs, iconGradientTexture } from "./SvgGradientTexture"
import { attachSvgWipeCaps } from "./SvgWipeCaps"
import { finiteNumber } from "./SvgGeometry"
import {
  applyInnerElementScale,
  applyMeshSetScale,
  cacheInnerGeometryElements,
} from "./SvgGeometryScale"
import { svgExtrudeBaseSettings } from "./SvgExtrudeSettings"
import { unionOverlappingSvgShapes } from "./SvgShapeUnion"
import { createSvgPathMaterial } from "./SvgPathMaterial"
import {
  collectRoofRidgeHeights,
  computeShapeMedialRoof,
  createSvgShapeGeometry,
  medialRoofPitchFromHeights,
  type MedialRoofPitch,
} from "./SvgShapeGeometry"
import type { SkeletonRoofResult } from "./StraightSkeleton"
import {
  parseSvgShapes,
  type ParsedSvgPath,
  type ParsedSvgShapes,
} from "./SvgParsing"
import type { SvgCanvasProps } from "./SvgTypes"
import { registerSvgGroupDepth, type SvgDepthLayer } from "./SvgModelDepth"

const isGlyphriseSlashPath = (path: ParsedSvgPath) =>
  (
    path.userData?.node as
      | { getAttribute?: (name: string) => string | null }
      | undefined
  )?.getAttribute?.("data-glyphrise-slash") === "true"

export const buildSvgIconGroup = ({
  svgContent,
  isIconA,
  props,
  clipPlaneA,
  clipPlaneB,
}: {
  svgContent: string
  isIconA: boolean
  props: SvgCanvasProps
  clipPlaneA: THREE.Plane | null
  clipPlaneB: THREE.Plane | null
}): THREE.Group => {
  const group = new THREE.Group()
  if (!svgContent) return group

  let parsedSvg: ParsedSvgShapes
  try {
    parsedSvg = parseSvgShapes(svgContent)
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : ""
    throw new Error(`Could not parse the SVG geometry.${detail}`)
  }

  const { paths, shapesByPath } = parsedSvg
  const pathCount = paths.length
  const centerOffset = new THREE.Vector3()
  const pendingLayerScales: Array<{
    mesh: THREE.Mesh
    scale: NonNullable<SvgCanvasProps["pathOverridesA"]>[number]["scale"]
  }> = []
  const baseExtrude = svgExtrudeBaseSettings(props)
  const depthLayers: SvgDepthLayer[] = []
  const layerSpacing = finiteNumber(props.layerSpacing, 0)
  // Separate SVG paths are nudged forward to avoid z-fighting between
  // stacked coplanar fills. Disconnected pieces of one compound path share
  // a plane; otherwise repeated details become a staircase in depth.
  // The depth-proportional term exists for
  // layered/colored looks, but under cut finishes the icon must read as ONE
  // carved solid — scaling the gap with extrusion depth visibly pushes upper
  // shapes (e.g. a database icon's top ring) in front of the body, so cut
  // finishes keep only the constant anti-z-fight epsilon. Explicit layer
  // spacing still applies.
  const pathLayerGap =
    pathCount > 1
      ? Math.max(
          SVG_PATH_LAYER_GAP_MIN,
          baseExtrude.crownEnabled
            ? 0
            : baseExtrude.depth * SVG_PATH_LAYER_GAP_RATIO,
          layerSpacing * 0.06
        )
      : 0

  const clippingPlanes: THREE.Plane[] = []
  const isWipeActive =
    props.transitionType === "wipe" &&
    (props.wipeDirection.x !== 0 || props.wipeDirection.y !== 0)

  if (isWipeActive) {
    if (isIconA && clipPlaneA) clippingPlanes.push(clipPlaneA)
    if (!isIconA && clipPlaneB) clippingPlanes.push(clipPlaneB)
  }

  const isCrossfade = props.transitionType === "fade"
  // Material Symbols are authored in a stable 24x24 icon space. Keep color
  // sampling in that same space so wipe pairs do not remap/reverse gradients.
  const iconBounds = new THREE.Box2(
    new THREE.Vector2(0, 0),
    new THREE.Vector2(ICON_VIEWBOX_SIZE, ICON_VIEWBOX_SIZE)
  )

  let layerOrder = 0
  const overrides = isIconA ? props.pathOverridesA : props.pathOverridesB
  const overrideByLayerId = new Map(
    (overrides ?? []).map((override) => [override.id, override])
  )
  const gradientType = props.gradientType ?? "linear"
  const gradientStops = gradientStopsFromFill(
    isIconA ? props.colorAStops : props.colorBStops,
    isIconA ? props.colorA : props.colorB,
    isIconA
      ? props.colorASecondary || props.colorA
      : props.colorBSecondary || props.colorB
  )
  const gradientMap = props.enableGradient
    ? iconGradientTexture(
        group,
        gradientType,
        gradientStops,
        props.materialPreset
      )
    : null

  // Under cut finishes every visible shape across all paths is welded into
  // one region before roofing: overlapping or abutting strokes then share a
  // single skeleton roof whose ridges meet in real junction gables, instead
  // of two finished solids interpenetrating ("pillars glued together, no
  // concrete"). The union also removes the need for any per-layer z gap.
  const wantsMedialRoof =
    baseExtrude.crownEnabled && baseExtrude.crownMode === "medial"
  const cutSourcePaths: ParsedSvgPath[] = []
  const cutSourceLayerIds: string[] = []
  let cutBodyShapes: THREE.Shape[] | null = null
  if (wantsMedialRoof) {
    const collected: THREE.Shape[] = []
    paths.forEach((path, pathIndex) => {
      const isSlashOverlay = isGlyphriseSlashPath(path)
      if (isSlashOverlay) return
      shapesByPath[pathIndex].forEach((shape, shapeIndex) => {
        const layerId = `${pathIndex}:${shapeIndex}`
        const override = overrideByLayerId.get(layerId)
        if (override && !override.visible) return
        cutSourcePaths.push(path)
        cutSourceLayerIds.push(layerId)
        collected.push(shape)
      })
    })
    if (collected.length > 0) {
      cutBodyShapes =
        collected.length > 1 ? unionOverlappingSvgShapes(collected) : collected
    }
  }
  const cutBodyPath = cutSourcePaths.length > 0 ? cutSourcePaths[0] : null

  // Precompute every welded shape's skeleton roof so the chisel pitch can be
  // derived from the combined ridge statistics. One shared pitch keeps all
  // strokes of the icon (and every glyph of a multi-shape text) meeting
  // their medial ridge lines at the same angle, like the reference numbers.
  const medialRoofByShape = new Map<THREE.Shape, SkeletonRoofResult | null>()
  let sharedRoofPitch: MedialRoofPitch | null = null
  if (cutBodyShapes) {
    const ridgeHeightsByShape: number[][] = []
    cutBodyShapes.forEach((shape) => {
      const roof = computeShapeMedialRoof(shape, baseExtrude.curveSegments)
      medialRoofByShape.set(shape, roof)
      if (roof) ridgeHeightsByShape.push(collectRoofRidgeHeights(roof))
    })
    sharedRoofPitch = medialRoofPitchFromHeights(
      ridgeHeightsByShape,
      baseExtrude,
      baseExtrude.depth
    )
  }

  const applyGradient = (geometry: THREE.BufferGeometry) => {
    applyIconGradientUvs(geometry, iconBounds)
  }

  // The welded cut body renders as one solid: every piece at z = 0 with one
  // material. Per-layer color/scale overrides do not apply here (visibility
  // already filtered the union input); the slash overlay still renders via
  // the regular path loop below.
  if (cutBodyShapes && cutBodyPath) {
    const bodyColor = cutBodyPath.color
      ? `#${cutBodyPath.color.getHexString()}`
      : isIconA
        ? props.colorA
        : props.colorB
    cutBodyShapes.forEach((shape, shapeIndex) => {
      const shapePts = shape.getPoints(12)
      if (
        shapePts.length < 2 ||
        shapePts.some((pt) => !Number.isFinite(pt.x) || !Number.isFinite(pt.y))
      ) {
        return
      }
      const shapeBox = new THREE.Box2().setFromPoints(shapePts)
      const shapeSize = new THREE.Vector2()
      shapeBox.getSize(shapeSize)
      if (!Number.isFinite(shapeSize.x) || !Number.isFinite(shapeSize.y)) {
        return
      }

      const shapeGeometry = createSvgShapeGeometry({
        shape,
        shapeSize,
        baseExtrude,
        depthMultiplier: 1,
        bevelEnabled: props.bevelEnabled,
        slashDepthRatio: GLYPHRISE_SLASH_DEPTH_RATIO,
        isSlashOverlay: false,
        medialRoofPlan: {
          roof: medialRoofByShape.get(shape) ?? null,
          pitch: sharedRoofPitch,
        },
      })
      if (!shapeGeometry) return

      const { geometry } = shapeGeometry
      applyGradient(geometry)

      const mesh = new THREE.Mesh(
        geometry,
        createSvgPathMaterial({
          props,
          color: bodyColor,
          isIconA,
          isCrossfade,
          gradientMap,
          layerOrder,
          isSlashOverlay: false,
          clippingPlanes,
        })
      )
      mesh.userData.cutSourceLayerIds = cutSourceLayerIds
      mesh.userData.pathLayerId = `cut:${shapeIndex}`
      mesh.userData.iconColorRole = isIconA ? "a" : "b"
      mesh.position.z = 0
      mesh.renderOrder = layerOrder
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
      layerOrder += 1
    })
  }

  paths.forEach((path, pathIndex) => {
    const isSlashOverlay = isGlyphriseSlashPath(path)

    shapesByPath[pathIndex].forEach((shape, shapeIndex) => {
      // The welded cut body already rendered every non-slash shape.
      if (cutBodyShapes && !isSlashOverlay) {
        layerOrder += 1
        return
      }
      const layerId = `${pathIndex}:${shapeIndex}`
      const override = overrideByLayerId.get(layerId)

      const isVisible = override ? override.visible : true
      if (!isVisible) {
        layerOrder += 1
        return
      }

      const customColor =
        override?.color ||
        (path.color
          ? `#${path.color.getHexString()}`
          : isIconA
            ? props.colorA
            : props.colorB)
      const depthMultiplier = Math.max(
        0.02,
        finiteNumber(override ? override.depthMultiplier : 1.0, 1.0)
      )
      const pathMaterial = createSvgPathMaterial({
        props,
        color: customColor,
        isIconA,
        isCrossfade,
        gradientMap,
        layerOrder: pathIndex,
        isSlashOverlay,
        clippingPlanes,
      })

      const shapePts = shape.getPoints(12)
      if (
        shapePts.length < 2 ||
        shapePts.some((pt) => !Number.isFinite(pt.x) || !Number.isFinite(pt.y))
      ) {
        layerOrder += 1
        return
      }

      const shapeBox = new THREE.Box2().setFromPoints(shapePts)
      const shapeSize = new THREE.Vector2()
      shapeBox.getSize(shapeSize)
      if (!Number.isFinite(shapeSize.x) || !Number.isFinite(shapeSize.y)) {
        layerOrder += 1
        return
      }

      const shapeGeometry = createSvgShapeGeometry({
        shape,
        shapeSize,
        baseExtrude,
        depthMultiplier,
        bevelEnabled: props.bevelEnabled,
        slashDepthRatio: GLYPHRISE_SLASH_DEPTH_RATIO,
        isSlashOverlay,
        medialRoofPlan: wantsMedialRoof
          ? {
              roof: medialRoofByShape.get(shape) ?? null,
              pitch: sharedRoofPitch,
            }
          : undefined,
      })
      if (!shapeGeometry) {
        layerOrder += 1
        return
      }

      const { geometry, extrude } = shapeGeometry
      applyGradient(geometry)

      const mesh = new THREE.Mesh(geometry, pathMaterial)
      depthLayers.push({
        mesh,
        shape,
        shapeSize,
        depthMultiplier,
        isSlashOverlay,
        pathIndex,
        extrude,
      })
      mesh.userData.pathLayerId = layerId
      mesh.userData.iconColorRole = isIconA ? "a" : "b"
      mesh.position.z = isSlashOverlay ? 0 : pathIndex * pathLayerGap
      mesh.renderOrder = isSlashOverlay ? 100 + layerOrder : layerOrder
      mesh.castShadow = true
      mesh.receiveShadow = true

      if (override?.scale) {
        pendingLayerScales.push({ mesh, scale: override.scale })
      }

      group.add(mesh)
      layerOrder += 1
    })
  })

  cacheInnerGeometryElements(group)
  applyInnerElementScale(group, props.innerElementScale)

  if (group.children.length > 0) {
    // Align paired icons by the SVG coordinate system, not by each icon's
    // individual mass. Otherwise adding a slash changes the origin and the
    // base glyph no longer overlaps the unslashed version during a wipe.
    centerOffset.set(ICON_VIEWBOX_SIZE / 2, ICON_VIEWBOX_SIZE / 2, 0)
    group.children.forEach((child) => {
      child.position.x -= centerOffset.x
      child.position.y -= centerOffset.y
      child.position.z -= centerOffset.z
    })
  }

  pendingLayerScales.forEach(({ mesh, scale }) => {
    if (scale) applyMeshSetScale([mesh], scale)
  })

  applySvgModelScale(group)
  registerSvgGroupDepth(group, pathCount, depthLayers)
  const capPlane = isIconA ? clipPlaneA : clipPlaneB
  if (capPlane) attachSvgWipeCaps(group, capPlane)

  return group
}
