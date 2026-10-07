"use client"

import { useEffect, useRef, type MutableRefObject } from "react"
import { flushSync } from "react-dom"
import * as THREE from "three"
import { useLatestRef } from "../../lib/use-latest-ref"
import type { SvgCanvasProps } from "./SvgTypes"
import type { RotationVelocity } from "./SvgPointerInteractionModel"
import type { SvgCanvasLiveRenderProps } from "./useSvgCanvasLiveRefs"
import { beginDocumentEdit, endDocumentEdit } from "@/lib/editor-transactions"

type RotationDragOptions = {
  liveRenderPropsRef: MutableRefObject<SvgCanvasLiveRenderProps>
  onViewRotationSet: SvgCanvasProps["onViewRotationSet"]
  requestRender: () => void
}

export function useSvgRotationDrag(options: RotationDragOptions) {
  const optionsRef = useLatestRef(options)
  const editingRef = useRef(false)
  const draggingEditRef = useRef(false)
  const setViewRotation: NonNullable<SvgCanvasProps["onViewRotationSet"]> = (
    target,
    settings = {}
  ) => {
    if (!editingRef.current) {
      editingRef.current = true
      beginDocumentEdit()
    }
    const { liveRenderPropsRef, onViewRotationSet, requestRender } =
      optionsRef.current
    const next = { ...liveRenderPropsRef.current.rotationOffset, ...target }
    // Update immediately so rapid pointer events never reuse stale React props.
    liveRenderPropsRef.current.rotationOffset = next
    const commit = settings.commit !== false
    const update = () => onViewRotationSet?.(next, settings)
    if (commit) flushSync(update)
    else update()
    requestRender()
    if (commit) {
      editingRef.current = false
      draggingEditRef.current = false
      endDocumentEdit()
    }
  }
  const applyViewRotationDelta = (delta: RotationVelocity) => {
    draggingEditRef.current = true
    const current = optionsRef.current.liveRenderPropsRef.current.rotationOffset
    setViewRotation(
      {
        x: current.x + THREE.MathUtils.radToDeg(delta.x),
        y: current.y + THREE.MathUtils.radToDeg(delta.y),
      },
      { commit: false }
    )
  }
  const finishViewRotation = (force = false) => {
    if (editingRef.current && (draggingEditRef.current || force)) {
      setViewRotation(
        optionsRef.current.liveRenderPropsRef.current.rotationOffset,
        { commit: true }
      )
    }
  }
  useEffect(
    () => () => {
      if (editingRef.current) endDocumentEdit()
    },
    []
  )
  return { applyViewRotationDelta, setViewRotation, finishViewRotation }
}
