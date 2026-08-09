import { describe, expect, it } from "vitest"
import { DEFAULT_WIPE_PAIR } from "./DefaultShapeIcons"
import { validateAndSanitizeSvg } from "./SvgImportModel"

describe("SvgImportModel", () => {
  it("accepts the path and basic-shape SVG subset used by the editor", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="translate(1 1)"><path fill="#fff" d="M0 0h10v10H0z"/><circle cx="12" cy="12" r="2"/></g></svg>`

    expect(validateAndSanitizeSvg(svg)).toBe(svg)
    expect(() =>
      DEFAULT_WIPE_PAIR.forEach((icon) =>
        validateAndSanitizeSvg(icon.svgContent)
      )
    ).not.toThrow()
  })

  it.each([
    `<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M0 0h1v1z"/></svg>`,
    `<svg viewBox="0 0 24 24" onload="alert(1)"><path d="M0 0h1v1z"/></svg>`,
    `<svg viewBox="0 0 24 24"><use href="https://example.com/icon.svg#x"/></svg>`,
    `<svg viewBox="0 0 24 24"><path style="fill:url(https://example.com/x)" d="M0 0h1v1z"/></svg>`,
    `<svg viewBox="0 0 24 24"><foreignObject><div>unsafe</div></foreignObject></svg>`,
  ])("rejects active or externally referenced markup", (svg) => {
    expect(() => validateAndSanitizeSvg(svg)).toThrow()
  })

  it("rejects malformed, unsupported, and empty SVG markup", () => {
    expect(() =>
      validateAndSanitizeSvg(`<svg><path d="M0 0"/></g></svg>`)
    ).toThrow(/unbalanced/i)
    expect(() =>
      validateAndSanitizeSvg(`<svg><text>Hello</text></svg>`)
    ).toThrow(/not supported/i)
    expect(() =>
      validateAndSanitizeSvg(`<svg viewBox="0 0 24 24"></svg>`)
    ).toThrow(/no supported paths/i)
  })

  it("caps file complexity and byte size", () => {
    const tooManyPaths = `<svg>${`<path d="M0 0h1v1z"/>`.repeat(1_001)}</svg>`
    const tooLarge = `<svg><path d="${"M0 0 ".repeat(200_000)}"/></svg>`

    expect(() => validateAndSanitizeSvg(tooManyPaths)).toThrow(
      /1,000 elements/i
    )
    expect(() => validateAndSanitizeSvg(tooLarge)).toThrow(/1 MB/i)
  })
})
