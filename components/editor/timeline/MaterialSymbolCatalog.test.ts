import { describe, expect, it } from "vitest"
import { visibleMaterialSymbols } from "./MaterialSymbolCatalog"
import { getMaterialSymbolNames } from "../IconLibrary"

describe("symbol discovery", () => {
  it("includes the full Google catalog and symbols beyond the common shortlist", () => {
    const catalog = getMaterialSymbolNames()
    expect(catalog.length).toBeGreaterThan(3000)
    expect(visibleMaterialSymbols(catalog, "calendar month")[0]).toBe(
      "calendar_month"
    )
    expect(visibleMaterialSymbols(catalog, "zoom out map")[0]).toBe(
      "zoom_out_map"
    )
  })

  it("keeps all results available to the virtualized grid", () => {
    const catalog = Array.from({ length: 180 }, (_, index) => `symbol_${index}`)
    expect(visibleMaterialSymbols(catalog, "")).toEqual(catalog)
    expect(visibleMaterialSymbols(catalog, "symbol")).toHaveLength(180)
  })

  it("finds familiar words and multiword phrases without requiring symbol IDs", () => {
    const catalog = [
      "favorite_off",
      "person",
      "search",
      "favorite",
      "settings",
      "home",
    ]
    expect(visibleMaterialSymbols(catalog, "heart")).toEqual([
      "favorite",
      "favorite_off",
    ])
    expect(visibleMaterialSymbols(catalog, "user profile")).toEqual(["person"])
    expect(visibleMaterialSymbols(catalog, "magnifying glass")).toEqual([
      "search",
    ])
    expect(visibleMaterialSymbols(catalog, "gear")).toEqual(["settings"])
  })

  it("puts exact names before partial matches, removes duplicates and respects the result limit", () => {
    expect(
      visibleMaterialSymbols(
        ["home_work", "add_home", "home", "home"],
        "HOME",
        2
      )
    ).toEqual(["home", "home_work"])
    expect(visibleMaterialSymbols(["home", "home", "person"], "")).toEqual([
      "home",
      "person",
    ])
  })

  it("does not invent symbols when a known catalog has no match", () => {
    expect(visibleMaterialSymbols(["home", "person"], "heart")).toEqual([])
    expect(visibleMaterialSymbols(["home", "person"], "not an icon")).toEqual(
      []
    )
    expect(visibleMaterialSymbols([], "heart")).toEqual(["favorite"])
  })
})
