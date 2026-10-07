"use client"

import type { UseInspectorSidebarPropsArgs } from "./InspectorSidebarPropsModel"
import { useInspectorKeyframeControls } from "./useInspectorKeyframeControls"
import { useInspectorSidebarProps } from "./useInspectorSidebarProps"

type InspectorControlProps =
  | "renderKeyframeControl"
  | "transformKeyframeControl"
  | "lightPositionKeyframeControl"

type UseEditorInspectorSurfaceArgs = Parameters<
  typeof useInspectorKeyframeControls
>[0] &
  Omit<UseInspectorSidebarPropsArgs, InspectorControlProps>

export function useEditorInspectorSurface(args: UseEditorInspectorSurfaceArgs) {
  const {
    renderKeyframeControl,
    renderLightPositionKeyframeControl,
    renderTransformKeyframeControl,
  } = useInspectorKeyframeControls(args)

  return useInspectorSidebarProps({
    ...args,
    renderKeyframeControl,
    transformKeyframeControl: renderTransformKeyframeControl(),
    lightPositionKeyframeControl: renderLightPositionKeyframeControl(),
  })
}
