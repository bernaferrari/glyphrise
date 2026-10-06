// Offline asset renderer. This entry is bundled only by generate-starter-previews.mjs.
import React, { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  SvgCanvas,
  type SvgCanvasProps,
  type SvgCanvasRef,
} from "../components/3d/SvgCanvas"
import {
  DEFAULT_GEOMETRY_SETTINGS,
  DEFAULT_LIGHT_SETTINGS,
  DEFAULT_TRANSFORM_SETTINGS,
  type EditorSnapshot,
} from "../components/editor/EditorModel"
import { materialDefaultSettings } from "../components/editor/FinishRegistry"
import { STATIC_STUDIO_LIGHTING } from "../components/editor/useLightEditor"
import { evaluateExportFrame } from "../components/editor/ExportFrameModel"
import { createInitialTimelineTracks } from "../components/editor/PropertyRegistry"
import {
  STARTERS,
  createStarterEditorSnapshot,
} from "../components/editor/StarterProjectModel"

const base: EditorSnapshot = {
  ...DEFAULT_GEOMETRY_SETTINGS,
  ...DEFAULT_LIGHT_SETTINGS,
  ...DEFAULT_TRANSFORM_SETTINGS,
  activeRecipeId: null,
  duration: 3,
  shapes: [],
  materialPreset: "satin",
  materialSettings: materialDefaultSettings("satin"),
  materialKeyframes: [],
  qualityKeyframes: [],
  innerScaleKeyframes: [],
  moveKeyframes: [],
  fillKeyframes: [],
  rotationAxisKeyframes: [],
  keyLightPositionKeyframes: [],
  tracks: createInitialTimelineTracks(),
  enableGradient: true,
  fillMode: "gradient",
  fillColor: "#ffffff",
  fillColorSecondary: "#ffffff",
  fillGradientType: "mesh",
  fillStops: [],
}
const studio = {
  ...base,
  ...base.materialSettings,
  iconAContent: "",
  iconBContent: "",
  colorA: "#ffffff",
  colorB: "#ffffff",
  transitionType: "cut",
  transitionProgress: 0,
  wipeDirection: { x: 0, y: 0 },
  isPlaying: false,
  wireframe: false,
  ...STATIC_STUDIO_LIGHTING,
  zoom: 1,
} satisfies SvgCanvasProps

declare global {
  interface Window {
    starterPreview?: {
      ids: string[]
      ready: boolean
      render: (id: string, time: number) => Promise<string>
    }
  }
}

function AssetRenderer() {
  const canvas = useRef<SvgCanvasRef>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!ready || !canvas.current) return
    const surface = canvas.current
    surface.prepareExportRender({
      width: 256,
      height: 256,
      backgroundColor: "#09090b",
    })
    window.starterPreview = {
      ids: STARTERS.map((starter) => starter.id),
      ready: true,
      async render(id, time) {
        const snapshot = createStarterEditorSnapshot(base, id)
        const frame = evaluateExportFrame(snapshot, time, studio)
        // A fixed three-quarter view reveals depth even for the pulse and bell.
        frame.rotationOffset = {
          x: frame.rotationOffset.x - 12,
          y: frame.rotationOffset.y - 22,
          z: frame.rotationOffset.z,
        }
        const image = await surface.renderExportFrame(frame)
        return image.toDataURL("image/png").split(",")[1]
      },
    }
    return () => surface.restorePreviewRender()
  }, [ready])
  return (
    <SvgCanvas
      ref={canvas}
      {...evaluateExportFrame(
        createStarterEditorSnapshot(base, "calendar"),
        0,
        studio
      )}
      onModelReadyChange={setReady}
    />
  )
}

createRoot(document.getElementById("root")!).render(<AssetRenderer />)
