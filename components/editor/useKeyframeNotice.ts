"use client"

import { useEffect, useRef, useState } from "react"

export function useKeyframeNotice({
  keyframeCount,
  projectId,
  currentTime,
  restoring,
}: {
  keyframeCount: number
  projectId: string
  currentTime: number
  restoring: boolean
}) {
  const wasRestoringRef = useRef(restoring)
  const previousKeyframeCountRef = useRef(keyframeCount)
  const previousKeyframeProjectIdRef = useRef(projectId)
  const keyframeNoticeTimerRef = useRef<number | null>(null)
  const [keyframeNotice, setKeyframeNotice] = useState<string | null>(null)

  useEffect(() => {
    const establishingBaseline = restoring || wasRestoringRef.current
    wasRestoringRef.current = restoring
    if (
      establishingBaseline ||
      previousKeyframeProjectIdRef.current !== projectId
    ) {
      previousKeyframeProjectIdRef.current = projectId
      previousKeyframeCountRef.current = keyframeCount
      setKeyframeNotice(null)
      if (keyframeNoticeTimerRef.current !== null) {
        window.clearTimeout(keyframeNoticeTimerRef.current)
        keyframeNoticeTimerRef.current = null
      }
      return
    }

    const previousCount = previousKeyframeCountRef.current
    previousKeyframeCountRef.current = keyframeCount
    if (keyframeCount <= previousCount) return

    const createdCount = keyframeCount - previousCount
    setKeyframeNotice(
      createdCount === 1
        ? `Keyframe created at ${currentTime.toFixed(2)}s`
        : `${createdCount} keyframes created`
    )
    if (keyframeNoticeTimerRef.current !== null) {
      window.clearTimeout(keyframeNoticeTimerRef.current)
    }
    keyframeNoticeTimerRef.current = window.setTimeout(() => {
      setKeyframeNotice(null)
      keyframeNoticeTimerRef.current = null
    }, 1800)
  }, [currentTime, keyframeCount, projectId, restoring])

  useEffect(
    () => () => {
      if (keyframeNoticeTimerRef.current !== null) {
        window.clearTimeout(keyframeNoticeTimerRef.current)
      }
    },
    []
  )

  return keyframeNotice
}
