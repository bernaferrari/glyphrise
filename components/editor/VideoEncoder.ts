import type { VideoContainer } from "../3d/SvgTypes"
import type { ExportSettings } from "./ExportSettingsModel"
import { videoFrameSchedule } from "./ExportFrameModel"

export async function supportedVideoContainers(): Promise<VideoContainer[]> {
  if (typeof VideoEncoder === "undefined") return []
  const { canEncodeVideo } = await import("mediabunny")
  const supported: VideoContainer[] = []
  if ((await canEncodeVideo("vp9")) || (await canEncodeVideo("vp8")))
    supported.push("webm")
  if (await canEncodeVideo("avc")) supported.push("mp4")
  return supported
}

export function awaitExportWork<T>(
  work: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () =>
      finish(() => reject(new Error("Video export was canceled.")))
    const timeout = setTimeout(
      () =>
        finish(() =>
          reject(new Error("Video export timed out while preparing a frame."))
        ),
      30_000
    )
    const finish = (settle: () => void) => {
      clearTimeout(timeout)
      signal.removeEventListener("abort", abort)
      settle()
    }
    signal.addEventListener("abort", abort, { once: true })
    if (signal.aborted) abort()
    work.then(
      (value) => finish(() => resolve(value)),
      (error) => finish(() => reject(error))
    )
  })
}

/** Encode authored timestamps, independent of rendering or wall-clock speed. */
export async function encodeTimelineVideo({
  duration,
  settings,
  renderFrame,
  signal,
  onProgress,
}: {
  duration: number
  settings: ExportSettings
  renderFrame: (time: number) => Promise<HTMLCanvasElement>
  signal: AbortSignal
  onProgress: (progress: number) => void
}) {
  const {
    Output,
    BufferTarget,
    CanvasSource,
    WebMOutputFormat,
    Mp4OutputFormat,
    canEncodeVideo,
  } = await import("mediabunny")
  const codecs =
    settings.container === "mp4"
      ? ["avc" as const]
      : ["vp9" as const, "vp8" as const]
  let codec: (typeof codecs)[number] | undefined
  for (const candidate of codecs) {
    if (
      await awaitExportWork(
        canEncodeVideo(candidate, {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
        }),
        signal
      )
    ) {
      codec = candidate
      break
    }
  }
  if (!codec)
    throw new Error(
      `${settings.container.toUpperCase()} encoding at this size is not supported in this browser. Try a smaller size or another format.`
    )
  const frames = videoFrameSchedule(duration, settings.frameRate)
  const canvas = await awaitExportWork(renderFrame(0), signal)
  const output = new Output({
    format:
      settings.container === "mp4"
        ? new Mp4OutputFormat()
        : new WebMOutputFormat(),
    target: new BufferTarget(),
  })
  const source = new CanvasSource(canvas, {
    codec,
    bitrate: settings.videoBitsPerSecond,
    latencyMode: "quality",
  })
  output.addVideoTrack(source, { frameRate: settings.frameRate })
  const cancel = () => {
    void output.cancel().catch(() => {})
  }
  signal.addEventListener("abort", cancel, { once: true })
  try {
    await awaitExportWork(output.start(), signal)
    for (const [index, frame] of frames.entries()) {
      if (signal.aborted) throw new Error("Video export was canceled.")
      if (index > 0) await awaitExportWork(renderFrame(frame.time), signal)
      await awaitExportWork(
        source.add(frame.time, frame.duration, { keyFrame: index === 0 }),
        signal
      )
      onProgress(((index + 1) / frames.length) * 0.9)
    }
    source.close()
    await awaitExportWork(output.finalize(), signal)
    const buffer = output.target.buffer
    if (!buffer || buffer.byteLength === 0)
      throw new Error("The browser returned an empty video recording.")
    const blob = new Blob([buffer], { type: `video/${settings.container}` })
    await awaitExportWork(
      validateEncodedVideo(
        blob,
        duration,
        settings.frameRate,
        settings.width,
        settings.height
      ),
      signal
    )
    onProgress(1)
    return blob
  } catch (error) {
    await output.cancel().catch(() => {})
    throw error
  } finally {
    signal.removeEventListener("abort", cancel)
  }
}

/** Check the container's actual sequence and decode representative output frames. */
export async function validateEncodedVideo(
  blob: Blob,
  duration: number,
  fps: number,
  width: number,
  height: number
) {
  if (blob.size === 0)
    throw new Error("The browser returned an empty video recording.")
  const { Input, ALL_FORMATS, BlobSource, EncodedPacketSink, VideoSampleSink } =
    await import("mediabunny")
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(blob),
  })
  try {
    const track = await input.getPrimaryVideoTrack()
    if (
      !track ||
      track.displayWidth !== width ||
      track.displayHeight !== height
    )
      throw new Error("Encoded video has incorrect dimensions.")
    const actualDuration = await input.computeDuration()
    if (Math.abs(actualDuration - duration) > 0.003)
      throw new Error("Encoded video has an incorrect duration.")
    const frames = videoFrameSchedule(duration, fps)
    const timestamps: number[] = []
    for await (const packet of new EncodedPacketSink(track).packets())
      timestamps.push(packet.timestamp)
    // Codecs may emit B-frames in decoding order. Validate presentation order.
    timestamps.sort((a, b) => a - b)
    const count = timestamps.length
    if (count !== frames.length)
      throw new Error("Encoded video is missing frames.")
    if (
      timestamps.some(
        (time, index) => Math.abs(time - frames[index].time) > 0.002
      )
    )
      throw new Error("Encoded video has an incorrect frame sequence.")
    const sink = new VideoSampleSink(track)
    for (const index of new Set([0, Math.floor(count / 2), count - 1])) {
      const sample = await sink.getSample(frames[index].time + 0.002)
      if (!sample) throw new Error("The exported video could not be decoded.")
      sample.close()
    }
  } finally {
    input.dispose()
  }
}
