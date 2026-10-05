import { expect, it } from "vitest"
import { videoFrameSchedule } from "./ExportFrameModel"
import { validateEncodedVideo } from "./VideoEncoder"

it.each([24, 30, 60])(
  "samples exact %s fps timestamps over a half-open interval",
  (fps) => {
    const frames = videoFrameSchedule(1, fps)
    expect(frames).toHaveLength(fps)
    expect(frames[1].time).toBe(1 / fps)
    expect(frames.at(-1)!.time).toBe((fps - 1) / fps)
    expect(frames.at(-1)!.time + frames.at(-1)!.duration).toBe(1)
  }
)
it("preserves fractional duration with a partial last frame", () => {
  const frames = videoFrameSchedule(1.03, 24)
  expect(frames).toHaveLength(25)
  expect(frames.at(-1)).toEqual({ time: 1, duration: 0.030000000000000027 })
})
it("rejects a zero-byte recording before trying to decode it", async () => {
  await expect(
    validateEncodedVideo(new Blob([]), 1, 24, 128, 128)
  ).rejects.toThrow(/empty/)
})
