import { afterEach, expect, it, vi } from "vitest"
import {
  fetchMaterialSymbolIcon,
  getMaterialSymbolNames,
  PRESET_ICONS,
} from "./IconLibrary"
import { STARTERS, slashedIcon } from "./StarterProjectModel"
import { DEFAULT_WIPE_PAIR } from "./DefaultShapeIcons"

afterEach(() => vi.unstubAllGlobals())

it("imports a font alias through the equivalent canonical SVG", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(
      new Response('<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>')
    )
  vi.stubGlobal("fetch", fetch)

  const icon = await fetchMaterialSymbolIcon("access_alarm")
  expect(fetch).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining("/access_alarm/")
  )
  expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining("/alarm/"))
  expect(icon.name).toBe("Access Alarm")
  expect(icon.svgContent).toContain("<path")
})

it("uses catalog symbol identities for every preset and starter", () => {
  const catalog = new Set(getMaterialSymbolNames())
  for (const icon of [
    ...PRESET_ICONS,
    ...STARTERS.map((starter) => starter.icon),
  ]) {
    expect(icon.id, icon.name).toMatch(/^material-symbol-outlined-/)
    expect(
      catalog.has(icon.id.replace("material-symbol-outlined-", "")),
      icon.name
    ).toBe(true)
  }
})

it("reuses each bundled preset when the same symbol is imported", async () => {
  const fetch = vi.fn()
  vi.stubGlobal("fetch", fetch)
  for (const icon of PRESET_ICONS) {
    const name = icon.id.replace("material-symbol-outlined-", "")
    expect(await fetchMaterialSymbolIcon(name)).toEqual(icon)
    expect(icon.svgContent).toContain('viewBox="0 0 24 24"')
  }
  expect(fetch).not.toHaveBeenCalled()
})

it("uses the same off-symbol identity and SVG in starters, blank files, and imports", async () => {
  const fetch = vi.fn()
  vi.stubGlobal("fetch", fetch)
  const wifi = STARTERS.find((starter) => starter.id === "wifi")!.icon
  expect(await fetchMaterialSymbolIcon("wifi_off")).toEqual(slashedIcon(wifi))
  expect(await fetchMaterialSymbolIcon("account_circle")).toEqual(
    DEFAULT_WIPE_PAIR[0]
  )
  expect(await fetchMaterialSymbolIcon("account_circle_off")).toEqual(
    DEFAULT_WIPE_PAIR[1]
  )
  expect(fetch).not.toHaveBeenCalled()
})

it("normalizes imported dimension-only SVGs before creating symbol geometry", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<svg width="48" height="48"><path d="M4 4h40v40H4z"/></svg>'
        )
      )
  )
  const icon = await fetchMaterialSymbolIcon("auto_awesome", "sharp")
  expect(icon.svgContent).toContain('viewBox="0 0 24 24"')
  expect(icon.svgContent).toContain("matrix(0.5 0 0 0.5 0 0)")
})
