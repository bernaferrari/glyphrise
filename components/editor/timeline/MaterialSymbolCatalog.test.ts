import { describe, expect, it } from "vitest"
import { getMaterialSymbolNames } from "../IconLibrary"
import { MATERIAL_WIPE_PAIRS } from "../MaterialWipePairs"
import {
  visibleMaterialSymbols,
  visibleWipePairs,
} from "./MaterialSymbolCatalog"

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

  it("offers every authored wipe pair, including ones that used to be hidden", () => {
    const names = new Set(getMaterialSymbolNames())
    const shown = visibleWipePairs("")
    expect(shown).toEqual(MATERIAL_WIPE_PAIRS)
    expect(shown.length).toBe(167)
    for (const pair of shown) {
      expect(names.has(pair.enabled), pair.label).toBe(true)
      expect(pair).not.toHaveProperty("disabled")
    }

    const byLabel = Object.fromEntries(shown.map((pair) => [pair.label, pair]))
    expect(byLabel["Mobile Data Arrows"]).toEqual({
      label: "Mobile Data Arrows",
      enabled: "1x_mobiledata",
    })
    expect(byLabel["VR180 Create 2d"]).toEqual({
      label: "VR180 Create 2d",
      enabled: "vr180_create2d",
    })
    expect(byLabel["Wifi"]).toEqual({ label: "Wifi", enabled: "wifi" })
    expect(byLabel["Wifi Tethering"]).toEqual({
      label: "Wifi Tethering",
      enabled: "wifi_tethering",
    })
    expect(byLabel["Android Wifi 3 Bar"].enabled).toBe("android_wifi_3_bar")
    expect(
      visibleWipePairs("wifi tethering").map((pair) => pair.label)
    ).toEqual(["Wifi Tethering"])
  })

  it("does not invent symbols when a known catalog has no match", () => {
    expect(visibleMaterialSymbols(["home", "person"], "heart")).toEqual([])
    expect(visibleMaterialSymbols(["home", "person"], "not an icon")).toEqual(
      []
    )
    expect(visibleMaterialSymbols([], "heart")).toEqual(["favorite"])
  })
})
