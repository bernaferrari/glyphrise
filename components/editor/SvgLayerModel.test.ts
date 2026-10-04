// @vitest-environment happy-dom
import { describe, expect, it } from "vitest"
import { extractSvgLayers } from "./SvgLayerModel"
import calendarProject from "../../docs/calendar-motion.glyphrise.json"

describe("SvgLayerModel", () => {
  it("exposes the calendar frame and six date dots as seven layers", () => {
    const layers = extractSvgLayers(
      calendarProject.snapshot.shapes[0].svgContent
    )

    expect(layers.map((layer) => layer.id)).toEqual(
      Array.from({ length: 7 }, (_, index) => `0:${index}`)
    )
  })

  it("splits minified disconnected subpaths without counting holes as layers", () => {
    const layers = extractSvgLayers(
      '<svg><path d="M0 0h10v10H0zM2 2v6h6V2zM12 0h10v10H12z"/></svg>'
    )

    expect(layers.map((layer) => layer.id)).toEqual(["0:0", "0:1"])
  })

  it("keeps primitive elements and merged subpaths aligned with renderer IDs", () => {
    const layers = extractSvgLayers(`
      <svg viewBox="0 0 24 24">
        <rect id="frame" fill="#ff0000" x="0" y="0" width="4" height="4" />
        <path id="joined" d="M6 0h4v4H6zM8 0h4v4H8z" />
        <circle id="dot" cx="18" cy="2" r="2" />
      </svg>
    `)

    expect(layers.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "0:0", name: "frame" },
      { id: "1:0", name: "joined" },
      { id: "2:0", name: "dot" },
    ])
  })

  it("extracts one layer for each SVG path", () => {
    const layers = extractSvgLayers(`
      <svg viewBox="0 0 24 24">
        <path id="outer" fill="#ff0000" d="M0 0h10v10H0z" />
        <path id="inner" fill="#00ff00" d="M12 0h10v10H12z" />
      </svg>
    `)

    expect(layers.map(({ id, name, color }) => ({ id, name, color }))).toEqual([
      { id: "0:0", name: "outer", color: "#ff0000" },
      { id: "1:0", name: "inner", color: "#00ff00" },
    ])
  })

  it("splits disconnected subpaths into selectable layer targets", () => {
    const layers = extractSvgLayers(`
      <svg viewBox="0 0 24 24">
        <path data-name="Compound" d="M0 0h10v10H0z M12 0h10v10H12z" />
      </svg>
    `)

    expect(layers.map((layer) => layer.id)).toEqual(["0:0", "0:1"])
    expect(layers.map((layer) => layer.name)).toEqual([
      "Compound 1",
      "Compound 2",
    ])
  })

  it("returns the cached layer model for unchanged SVG content", () => {
    const svg = `<svg><path id="a" d="M0 0h10v10H0z" /></svg>`

    expect(extractSvgLayers(svg)).toBe(extractSvgLayers(svg))
  })

  it("shows each part in the same thumbnail bounds and preserves holes", () => {
    const layers = extractSvgLayers(
      '<svg><path d="M0 0h10v10H0zM2 2v6h6V2zM12 0h10v10H12z"/></svg>'
    )

    expect(layers[0].preview?.viewBox).toBe(layers[1].preview?.viewBox)
    expect(layers[0].preview?.path.match(/M/g)).toHaveLength(2)
    expect(layers[1].preview?.path.match(/M/g)).toHaveLength(1)
    expect(layers[0].preview?.path).not.toBe(layers[1].preview?.path)
  })
})
