import { describe, expect, it } from "vitest"
import { visibleMaterialSymbols } from "./MaterialSymbolCatalog"

describe("symbol discovery", () => {
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
