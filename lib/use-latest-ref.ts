"use client"

import { useRef, useState } from "react"

export function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

type Handlers = Record<string, (...args: never[]) => unknown>

/**
 * The same functions on every render, each calling the latest one passed in.
 * For handlers handed to memoized children, so a re-render with fresh
 * closures doesn't invalidate them.
 */
export function useStableHandlers<T extends Handlers>(handlers: T): T {
  const latest = useLatestRef(handlers)
  const [stable] = useState(
    () =>
      Object.fromEntries(
        Object.keys(handlers).map((key) => [
          key,
          (...args: never[]) => latest.current[key](...args),
        ])
      ) as T
  )
  return stable
}
