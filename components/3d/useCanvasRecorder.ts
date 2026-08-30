import { useCallback, useEffect, useRef } from "react"

export type CanvasRecorderOptions = {
  frameRate?: number
  manualFrames?: boolean
  mimeType?: string
  videoBitsPerSecond?: number
  onError?: (error: Error) => void
}

type CanvasVideoTrack = MediaStreamTrack & {
  requestFrame?: () => void
}

const stopStreamTracks = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop())
}

const toRecorderError = (event: Event) => {
  const error = (event as Event & { error?: unknown }).error
  return error instanceof Error
    ? error
    : new Error("The browser stopped the video recorder unexpectedly.")
}

export const useCanvasRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const canvasTrackRef = useRef<CanvasVideoTrack | null>(null)
  const completionCallbackRef = useRef<((blob: Blob) => void) | null>(null)
  const errorCallbackRef = useRef<((error: Error) => void) | null>(null)

  const releaseRecording = useCallback((deliverRecording: boolean) => {
    const recorder = mediaRecorderRef.current
    const stream = streamRef.current
    const chunks = recordedChunksRef.current
    const onComplete = completionCallbackRef.current

    if (recorder) {
      recorder.ondataavailable = null
      recorder.onerror = null
      recorder.onstop = null
    }

    mediaRecorderRef.current = null
    streamRef.current = null
    canvasTrackRef.current = null
    completionCallbackRef.current = null
    errorCallbackRef.current = null
    recordedChunksRef.current = []
    stopStreamTracks(stream)

    if (deliverRecording && onComplete) {
      const mimeType =
        recorder?.mimeType || chunks.find((chunk) => chunk.type)?.type || ""
      onComplete(new Blob(chunks, { type: mimeType }))
    }
  }, [])

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current

    // Clear handlers before stopping so an abort can never deliver a partial
    // recording or re-enter the export completion path.
    if (recorder) {
      recorder.ondataavailable = null
      recorder.onerror = null
      recorder.onstop = null
      if (recorder.state !== "inactive") {
        try {
          recorder.stop()
        } catch {
          // Resource release below is authoritative even when stop() fails.
        }
      }
    }

    releaseRecording(false)
  }, [releaseRecording])

  const startRecording = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      {
        frameRate = 30,
        manualFrames = false,
        mimeType,
        videoBitsPerSecond,
        onError,
      }: CanvasRecorderOptions = {}
    ) => {
      if (!canvas) throw new Error("The 3D preview canvas is not ready.")

      // A new recording must never inherit a recorder or tracks from an older
      // interrupted export.
      cancelRecording()

      const createStream = (requestedFrameRate: number) =>
        canvas.captureStream(requestedFrameRate)
      let stream: MediaStream | null = null

      try {
        stream = createStream(manualFrames ? 0 : frameRate)
        let canvasTrack = stream.getVideoTracks()[0] as
          | CanvasVideoTrack
          | undefined

        if (manualFrames && !canvasTrack?.requestFrame) {
          throw new Error(
            "This browser cannot render deterministic video frames. Try the latest Chrome or Edge."
          )
        }

        if (!canvasTrack) {
          throw new Error("The browser did not create a video track.")
        }

        if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error(`This browser cannot record ${mimeType}.`)
        }
        const recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          ...(videoBitsPerSecond ? { videoBitsPerSecond } : {}),
        })

        recordedChunksRef.current = []
        mediaRecorderRef.current = recorder
        streamRef.current = stream
        canvasTrackRef.current = canvasTrack
        errorCallbackRef.current = onError ?? null

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksRef.current.push(event.data)
        }
        recorder.onstop = () => releaseRecording(true)
        recorder.onerror = (event) => {
          const recorderError = toRecorderError(event)
          const notifyError = errorCallbackRef.current
          cancelRecording()
          notifyError?.(recorderError)
        }

        recorder.start(250)
      } catch (error) {
        // Constructor/start failures can happen after captureStream succeeds.
        // cancelRecording owns any assigned refs; this also covers a stream
        // created before the recorder itself was assigned.
        cancelRecording()
        stopStreamTracks(stream)
        throw error
      }
    },
    [cancelRecording, releaseRecording]
  )

  const requestFrame = useCallback(() => {
    canvasTrackRef.current?.requestFrame?.()
  }, [])

  const stopRecording = useCallback(
    (callback: (blob: Blob) => void) => {
      const recorder = mediaRecorderRef.current
      if (!recorder) throw new Error("No canvas recording is active.")

      completionCallbackRef.current = callback
      if (recorder.state === "inactive") {
        releaseRecording(true)
        return
      }

      try {
        recorder.stop()
      } catch (error) {
        cancelRecording()
        throw error
      }
    },
    [cancelRecording, releaseRecording]
  )

  useEffect(() => cancelRecording, [cancelRecording])

  return {
    cancelRecording,
    requestFrame,
    startRecording,
    stopRecording,
  }
}
