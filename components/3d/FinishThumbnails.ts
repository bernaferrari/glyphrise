import * as THREE from "three"
import { applySceneToneMapping } from "./SvgSceneSetup"
import {
  createThreeMaterial,
  finishDefaultSettings,
  finishLightMultiplier,
  isAdditiveFinish,
  isGlowingFinish,
  isTranslucentFinish,
  type MaterialPresetId,
  finishEnvironmentIntensity,
} from "./MaterialPresets"
import { applyGradientVertexColors } from "./SvgColor"
import { createStudioEnvironment } from "./SvgSceneUtils"

import {
  readStoredFinishThumbnails,
  writeStoredFinishThumbnails,
  type StoredFinishThumbnails,
} from "./FinishThumbnailStorage"

const THUMBNAIL_SIZE = 128
const MAX_CACHED_THUMBNAILS = 320
const CAMERA_FOV = 28
const CAMERA_DISTANCE = 4.7

/** How much of the thumbnail's width the sphere covers. */
export const THUMBNAIL_SPHERE_FILL =
  1 / (CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2)))

export type FinishPreviewFill = {
  color: string
  gradient?: {
    type: "linear" | "radial" | "conic" | "mesh"
    stops: Array<{ color: string; position: number; x?: number; y?: number }>
  }
}

type ThumbnailStage = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  sphere: THREE.Mesh
  backdrop: THREE.Mesh
  keyLight: THREE.DirectionalLight
  maskMaterial: THREE.MeshBasicMaterial
  stripes: THREE.Texture
  output: CanvasRenderingContext2D
  scratch: CanvasRenderingContext2D
}

let stage: ThumbnailStage | null | undefined
const cache = new Map<string, string>()
let stored: StoredFinishThumbnails | null | undefined
let persistTimeout: number | undefined

function restoreThumbnailCache() {
  if (stored !== undefined || typeof window === "undefined") return
  stored = readStoredFinishThumbnails()
  if (!stored) return
  for (const [preset, url] of Object.entries(stored.thumbnails)) {
    if (url) cache.set(`${preset}:${stored.fillKey}`, url)
  }
}

function rememberThumbnail(
  preset: MaterialPresetId,
  fillKey: string,
  url: string
) {
  if (typeof window === "undefined") return
  if (stored?.fillKey !== fillKey) stored = { fillKey, thumbnails: {} }
  stored.thumbnails[preset] = url
  window.clearTimeout(persistTimeout)
  persistTimeout = window.setTimeout(() => {
    if (stored) writeStoredFinishThumbnails(stored)
  }, 500)
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const safeColor = (color: string) =>
  HEX_COLOR.test(color) ? color.toLowerCase() : "#7c83ff"

export const finishPreviewFillKey = (fill: FinishPreviewFill) =>
  fill.gradient && fill.gradient.stops.length > 1
    ? `${fill.gradient.type}(${fill.gradient.stops
        .map(
          (stop) =>
            `${safeColor(stop.color)}@${stop.position.toFixed(3)}:${stop.x ?? ""},${stop.y ?? ""}`
        )
        .join(";")})`
    : safeColor(fill.color)

const create2d = () => {
  const canvas = document.createElement("canvas")
  canvas.width = THUMBNAIL_SIZE
  canvas.height = THUMBNAIL_SIZE
  return canvas.getContext("2d")
}

/** Soft diagonal stripes: refraction and frosting are only visible against detail. */
const createBackdropTexture = () => {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext("2d")
  if (context) {
    context.fillStyle = "#334155"
    context.fillRect(0, 0, 64, 64)
    context.strokeStyle = "#e2e8f0"
    context.lineWidth = 9
    for (let offset = -64; offset < 128; offset += 22) {
      context.beginPath()
      context.moveTo(offset, 0)
      context.lineTo(offset + 64, 64)
      context.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

/**
 * One small offscreen renderer shared by every swatch. It mirrors the
 * viewport's tone mapping, studio environment, and per-finish light scaling,
 * so a swatch shows what the icon will actually look like.
 */
const getStage = (): ThumbnailStage | null => {
  if (stage !== undefined) return stage
  if (typeof document === "undefined") return null

  try {
    const output = create2d()
    const scratch = create2d()
    if (!output || !scratch) throw new Error("2D canvas unavailable")

    const renderer = new THREE.WebGLRenderer({
      canvas: document.createElement("canvas"),
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(1)
    renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, false)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    scene.environment = createStudioEnvironment(renderer)

    const stripes = createBackdropTexture()
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({
        map: stripes,
        toneMapped: false,
      })
    )
    backdrop.position.z = -2
    scene.add(backdrop)

    scene.add(new THREE.AmbientLight("#ffffff", 0.3))
    const keyLight = new THREE.DirectionalLight("#ffffff", 1)
    keyLight.position.set(3, 4, 5)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight("#bfdbfe", 0.9)
    rimLight.position.set(-5, -2, 2)
    scene.add(rimLight)

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 20)
    camera.position.set(0, 0, CAMERA_DISTANCE)

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40))
    sphere.rotation.set(0.35, -0.5, 0)
    scene.add(sphere)

    stage = {
      renderer,
      scene,
      camera,
      sphere,
      backdrop,
      keyLight,
      maskMaterial: new THREE.MeshBasicMaterial({
        color: "#ffffff",
        toneMapped: false,
      }),
      output,
      scratch,
      stripes,
    }
  } catch {
    stage = null
  }
  return stage
}

/** Paints the gradient across the sphere the way it spans an icon. */
const applyPreviewFill = (
  geometry: THREE.BufferGeometry,
  fillKey: string,
  fill: FinishPreviewFill
) => {
  if (geometry.userData.fillKey === fillKey) return
  geometry.userData.fillKey = fillKey
  if (!fill.gradient || fill.gradient.stops.length < 2) {
    geometry.deleteAttribute("color")
    return
  }
  // Icon space runs top-down, so flip Y before sampling.
  const flipped = geometry.clone().scale(1, -1, 1)
  applyGradientVertexColors(
    flipped,
    fill.gradient.type,
    fill.gradient.stops.map((stop) => ({
      ...stop,
      color: safeColor(stop.color),
    })),
    new THREE.Box2(new THREE.Vector2(-1, -1), new THREE.Vector2(1, 1))
  )
  const colors = flipped.getAttribute("color")
  if (colors) geometry.setAttribute("color", colors)
  flipped.dispose()
}

const averageFillColor = (fill: FinishPreviewFill) => {
  const stops = fill.gradient?.stops
  if (!stops || stops.length < 2) return new THREE.Color(safeColor(fill.color))
  const sum = new THREE.Color(0, 0, 0)
  stops.forEach((stop) => sum.add(new THREE.Color(safeColor(stop.color))))
  return sum.multiplyScalar(1 / stops.length)
}

const drawHalo = (context: CanvasRenderingContext2D, color: THREE.Color) => {
  const center = THUMBNAIL_SIZE / 2
  const halo = context.createRadialGradient(
    center,
    center,
    THUMBNAIL_SIZE * 0.3,
    center,
    center,
    THUMBNAIL_SIZE * 0.5
  )
  const rgb = `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`
  halo.addColorStop(0, `rgba(${rgb}, 0.7)`)
  halo.addColorStop(1, `rgba(${rgb}, 0)`)
  context.fillStyle = halo
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
}

export const cachedFinishThumbnail = (
  preset: MaterialPresetId,
  fill: FinishPreviewFill
) => {
  restoreThumbnailCache()
  return cache.get(`${preset}:${finishPreviewFillKey(fill)}`) ?? null
}

let queue: Promise<unknown> = Promise.resolve()

/**
 * Renders are serialized because they share one stage. Shaders compile in
 * the background first (where the browser supports it), so a new finish
 * never stalls the editor while its program builds.
 */
export const renderFinishThumbnail = (
  preset: MaterialPresetId,
  fill: FinishPreviewFill
): Promise<string | null> => {
  const cached = cachedFinishThumbnail(preset, fill)
  if (cached) return Promise.resolve(cached)
  const next = queue.then(() => renderNow(preset, fill))
  queue = next.catch(() => null)
  return next
}

const renderNow = async (
  preset: MaterialPresetId,
  fill: FinishPreviewFill
): Promise<string | null> => {
  const fillKey = finishPreviewFillKey(fill)
  const key = `${preset}:${fillKey}`
  const cached = cache.get(key)
  if (cached) return cached

  const current = getStage()
  if (!current) return null

  const {
    renderer,
    scene,
    camera,
    sphere,
    backdrop,
    keyLight,
    output,
    scratch,
  } = current
  const materialLight = 1.1 * finishLightMultiplier(preset)
  keyLight.intensity = materialLight * 1.25
  scene.environmentIntensity = finishEnvironmentIntensity(preset)
  applySceneToneMapping(renderer, materialLight)

  applyPreviewFill(sphere.geometry, fillKey, fill)
  const usesGradient = sphere.geometry.hasAttribute("color")
  const material = createThreeMaterial(preset, {
    ...finishDefaultSettings(preset),
    color: usesGradient ? "#ffffff" : safeColor(fill.color),
    opacity: 1,
    vertexColors: usesGradient,
  })

  output.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
  if (isGlowingFinish(preset)) drawHalo(output, averageFillColor(fill))

  const translucent = isTranslucentFinish(preset)
  // Additive finishes add light, so stripes would swamp them; use a dark stage.
  const backdropMaterial = backdrop.material as THREE.MeshBasicMaterial
  const additive = isAdditiveFinish(preset)
  const backdropMap = additive ? null : current.stripes
  if (backdropMaterial.map !== backdropMap) {
    backdropMaterial.map = backdropMap
    backdropMaterial.needsUpdate = true
  }
  backdropMaterial.color.set(additive ? "#0b1220" : "#ffffff")
  backdrop.visible = translucent
  sphere.material = material
  await renderer.compileAsync(scene, camera)
  renderer.render(scene, camera)

  if (translucent) {
    // Keep the refracted backdrop only where the sphere is.
    scratch.globalCompositeOperation = "copy"
    scratch.drawImage(renderer.domElement, 0, 0)
    backdrop.visible = false
    sphere.material = current.maskMaterial
    renderer.render(scene, camera)
    scratch.globalCompositeOperation = "destination-in"
    scratch.drawImage(renderer.domElement, 0, 0)
    output.drawImage(scratch.canvas, 0, 0)
  } else {
    output.drawImage(renderer.domElement, 0, 0)
  }

  const url = output.canvas.toDataURL("image/png")
  material.dispose()

  if (cache.size >= MAX_CACHED_THUMBNAILS) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, url)
  rememberThumbnail(preset, fillKey, url)
  return url
}
