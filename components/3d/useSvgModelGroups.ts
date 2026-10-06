import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react"
import * as THREE from "three"
import { buildSvgIconGroup } from "./SvgModelBuilder"
import { updateGroupFillColors } from "./SvgMaterialState"
import { disposeObjectTree } from "./SvgSceneUtils"
import type { SvgCanvasProps } from "./SvgTypes"
import { planSvgGroupDepthUpdate } from "./SvgModelDepth"
import { svgExtrudeBaseSettings } from "./SvgExtrudeSettings"

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
  const builtInputsRef = useRef<{
    a: readonly unknown[]
    b: readonly unknown[]
    groupA: THREE.Group
    groupB: THREE.Group
    depth: number
  } | null>(null)

  useEffect(() => {
    const pivot = pivotGroupRef.current
    if (!pivot) return

    const previousA = iconAGroupRef.current
    const previousB = iconBGroupRef.current
    const hadModel = Boolean(previousA || previousB)
    if (!hadModel) setModelReady(false)
    setModelError(null)

    // Retain the unchanged icon, but commit both candidates together only after
    // a successful build so a malformed SVG preserves the last valid preview.
    const sharedInputs = [
      pivot,
      props.bevelEnabled,
      props.bevelThickness,
      props.bevelSize,
      props.bevelSegments,
      svgExtrudeBaseSettings(props).curveSegments,
      props.layerSpacing,
      props.materialPreset,
      props.enableGradient,
      clipPlaneARef.current,
      clipPlaneBRef.current,
    ]
    const inputsA = [
      ...sharedInputs,
      props.iconAContent,
      pathOverridesASignature,
    ]
    const inputsB = [
      ...sharedInputs,
      props.iconBContent,
      pathOverridesBSignature,
    ]
    const built = builtInputsRef.current
    let rebuildA = previousA !== built?.groupA || !sameInputs(inputsA, built?.a)
    let rebuildB = previousB !== built?.groupB || !sameInputs(inputsB, built?.b)
    const depthChanged = props.extrusionDepth !== built?.depth
    const updateDepthA =
      !rebuildA && previousA && depthChanged
        ? planSvgGroupDepthUpdate(previousA, props)
        : null
    const updateDepthB =
      !rebuildB && previousB && depthChanged
        ? planSvgGroupDepthUpdate(previousB, props)
        : null
    if (depthChanged && !updateDepthA) rebuildA = true
    if (depthChanged && !updateDepthB) rebuildB = true

    let groupA: THREE.Group | null = previousA
    let groupB: THREE.Group | null = previousB
    try {
      if (rebuildA)
        groupA = buildSvgIconGroup({
          svgContent: props.iconAContent,
          isIconA: true,
          props,
          clipPlaneA: clipPlaneARef.current,
          clipPlaneB: clipPlaneBRef.current,
        })
      if (rebuildB)
        groupB = buildSvgIconGroup({
          svgContent: props.iconBContent,
          isIconA: false,
          props,
          clipPlaneA: clipPlaneARef.current,
          clipPlaneB: clipPlaneBRef.current,
        })
      if (
        !groupA ||
        !groupB ||
        (groupA.children.length === 0 && groupB.children.length === 0)
      ) {
        throw new Error("The SVG has no filled shapes that can become 3D.")
      }
    } catch (error) {
      if (rebuildA && groupA && groupA !== previousA) disposeObjectTree(groupA)
      if (rebuildB && groupB && groupB !== previousB) disposeObjectTree(groupB)
      setModelReady(hadModel)
      setModelError(
        error instanceof Error
          ? error.message
          : "Glyphrise could not build this SVG as a 3D icon."
      )
      return
    }

    updateDepthA?.()
    updateDepthB?.()
    if (rebuildA && previousA) {
      pivot.remove(previousA)
      disposeObjectTree(previousA)
    }
    if (rebuildB && previousB) {
      pivot.remove(previousB)
      disposeObjectTree(previousB)
    }

    if (rebuildA) pivot.add(groupA)
    if (rebuildB) pivot.add(groupB)
    iconAGroupRef.current = groupA
    iconBGroupRef.current = groupB
    builtInputsRef.current = {
      a: inputsA,
      b: inputsB,
      groupA,
      groupB,
      depth: props.extrusionDepth,
    }
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

function sameInputs(next: readonly unknown[], previous?: readonly unknown[]) {
  return (
    previous?.length === next.length &&
    next.every((value, index) => Object.is(value, previous[index]))
  )
}
