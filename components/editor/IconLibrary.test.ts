import { afterEach, expect, it, vi } from "vitest"
import { fetchMaterialSymbolIcon } from "./IconLibrary"

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
