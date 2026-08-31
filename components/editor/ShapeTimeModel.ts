import { clampNumber, quantizeTimeToFrame } from "./EditorModel"

export const SHAPE_MIN_GAP = 0.05

export const findAvailableShapeStopTime = ({
  times,
  requestedTime,
  duration,
  minTime = 0,
  maxTime = duration,
}: {
  times: number[]
  requestedTime: number
  duration: number
  minTime?: number
  maxTime?: number
}): number | null => {
  const lowerBound = clampNumber(minTime, 0, duration)
  const upperBound = clampNumber(maxTime, lowerBound, duration)
  const requested = quantizeTimeToFrame(
    clampNumber(requestedTime, lowerBound, upperBound)
  )
  const candidates = [
    requested,
    lowerBound,
    upperBound,
    ...times.flatMap((time) => [time - SHAPE_MIN_GAP, time + SHAPE_MIN_GAP]),
  ]
    .map((time) =>
      quantizeTimeToFrame(clampNumber(time, lowerBound, upperBound))
    )
    .filter(
      (candidate, index, values) =>
        values.indexOf(candidate) === index &&
        times.every(
          (time) => Math.abs(candidate - time) >= SHAPE_MIN_GAP - 0.0005
        )
    )

  if (candidates.length === 0) return null
  return candidates.sort((a, b) => {
    const distance = Math.abs(a - requested) - Math.abs(b - requested)
    return Math.abs(distance) > 0.0005 ? distance : b - a
  })[0]
}
