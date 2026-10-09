import { describe, expect, it } from "vitest"
import {
  DEFAULT_EXPORT_SETTINGS,
  availableVideoContainers,
  exportRenderOptions,
  projectPalette,
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

describe("projectPalette", () => {
  it("offers the icon's distinct colors, sorted by hue", () => {
    const palette = projectPalette({
      colorA: "#ff0000",
      colorB: "#FF0505",
      shapes: [
        {
          color: "#00ff00",
          colorSecondary: "#0000ff",
          fillStops: [{ color: "#00ff00" }, { color: "#0000ff" }],
        },
      ],
      fillKeyframes: [{ stops: [{ color: "#ffff00" }] }],
    })
    expect(palette).toEqual(["#ff0000", "#ffff00", "#00ff00", "#0000ff"])
  })
})
