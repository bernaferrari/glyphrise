import { describe, expect, it } from "vitest"
import {
  DEFAULT_EXPORT_SETTINGS,
  availableVideoContainers,
  exportRenderOptions,
  resolveVideoMimeType,
} from "./ExportSettingsModel"

describe("ExportSettingsModel", () => {
  it("selects a supported codec without lying about the container", () => {
    const supported = new Set(["video/webm;codecs=vp8", "video/mp4"])
    const isSupported = (mime: string) => supported.has(mime)

    expect(resolveVideoMimeType("webm", isSupported)).toBe(
      "video/webm;codecs=vp8"
    )
    expect(resolveVideoMimeType("mp4", isSupported)).toBe("video/mp4")
    expect(availableVideoContainers(isSupported)).toEqual(["webm", "mp4"])
  })

  it("clamps render dimensions and preserves transparent output", () => {
    expect(
      exportRenderOptions({
        ...DEFAULT_EXPORT_SETTINGS,
        width: 9,
        height: 9000,
      })
    ).toEqual({ width: 64, height: 4096, backgroundColor: null })
  })
})
