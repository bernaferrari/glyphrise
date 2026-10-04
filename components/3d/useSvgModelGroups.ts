import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react"
import * as THREE from "three"
import { buildSvgIconGroup } from "./SvgModelBuilder"
import { updateGroupFillColors } from "./SvgMaterialState"
import { disposeObjectTree } from "./SvgSceneUtils"
import type { SvgCanvasProps } from "./SvgTypes"

export const useSvgModelGroups = ({
  props,
  pivotGroupRef,
  iconAGroupRef,
  iconBGroupRef,
  clipPlaneARef,
  clipPlaneBRef,
  setModelReady,
  setModelError,
  pathOverridesASignature,
  pathOverridesBSignature,
  colorAStopsKey,
  colorBStopsKey,
}: {
  props: SvgCanvasProps
  pivotGroupRef: MutableRefObject<THREE.Group | null>
  iconAGroupRef: MutableRefObject<THREE.Group | null>
  iconBGroupRef: MutableRefObject<THREE.Group | null>
  clipPlaneARef: MutableRefObject<THREE.Plane | null>
  clipPlaneBRef: MutableRefObject<THREE.Plane | null>
  setModelReady: Dispatch<boolean>
  setModelError: Dispatch<SetStateAction<string | null>>
  pathOverridesASignature: string
  pathOverridesBSignature: string
  colorAStopsKey: string
  colorBStopsKey: string
}) => {
  useEffect(() => {
    const pivot = pivotGroupRef.current
    if (!pivot) return

    const previousA = iconAGroupRef.current
    const previousB = iconBGroupRef.current
    const hadModel = Boolean(previousA || previousB)
    if (!hadModel) setModelReady(false)
    setModelError(null)

    let groupA: THREE.Group | null = null
    let groupB: THREE.Group | null = null
    try {
      groupA = buildSvgIconGroup({
        svgContent: props.iconAContent,
        isIconA: true,
        props,
        clipPlaneA: clipPlaneARef.current,
        clipPlaneB: clipPlaneBRef.current,
      })
      groupB = buildSvgIconGroup({
        svgContent: props.iconBContent,
        isIconA: false,
        props,
        clipPlaneA: clipPlaneARef.current,
        clipPlaneB: clipPlaneBRef.current,
      })
      if (groupA.children.length === 0 && groupB.children.length === 0) {
        throw new Error("The SVG has no filled shapes that can become 3D.")
      }
    } catch (error) {
      if (groupA) disposeObjectTree(groupA)
      if (groupB) disposeObjectTree(groupB)
      setModelReady(hadModel)
      setModelError(
        error instanceof Error
          ? error.message
          : "Glyphrise could not build this SVG as a 3D icon."
      )
      return
    }

    if (previousA) {
      pivot.remove(previousA)
      disposeObjectTree(previousA)
    }
    if (previousB) {
      pivot.remove(previousB)
      disposeObjectTree(previousB)
    }

    pivot.add(groupA)
    pivot.add(groupB)
    iconAGroupRef.current = groupA
    iconBGroupRef.current = groupB
    setModelReady(groupA.children.length > 0 || groupB.children.length > 0)
  }, [
    props.iconAContent,
    props.iconBContent,
    props.extrusionDepth,
    props.bevelEnabled,
    props.bevelThickness,
    props.bevelSize,
    props.bevelSegments,
    props.geometryQuality,
    props.layerSpacing,
    props.materialPreset,
    props.enableGradient,
    pathOverridesASignature,
    pathOverridesBSignature,
    pivotGroupRef,
    iconAGroupRef,
    iconBGroupRef,
    clipPlaneARef,
    clipPlaneBRef,
    setModelReady,
    setModelError,
  ])

  useEffect(() => {
    updateGroupFillColors(iconAGroupRef.current, {
      color: props.colorA,
      colorSecondary: props.colorASecondary,
      colorStops: props.colorAStops,
      enableGradient: props.enableGradient,
      gradientType: props.gradientType,
      materialPreset: props.materialPreset,
      emissiveIntensity: props.emissiveIntensity,
    })
    updateGroupFillColors(iconBGroupRef.current, {
      color: props.colorB,
      colorSecondary: props.colorBSecondary,
      colorStops: props.colorBStops,
      enableGradient: props.enableGradient,
      gradientType: props.gradientType,
      materialPreset: props.materialPreset,
      emissiveIntensity: props.emissiveIntensity,
    })
  }, [
    props.colorA,
    props.colorB,
    props.colorASecondary,
    props.colorBSecondary,
    colorAStopsKey,
    colorBStopsKey,
    props.enableGradient,
    props.gradientType,
    props.materialPreset,
    props.emissiveIntensity,
    iconAGroupRef,
    iconBGroupRef,
  ])
}
