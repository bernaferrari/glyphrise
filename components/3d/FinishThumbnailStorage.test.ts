// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest"
import {
  readStoredFinishThumbnails,
  writeStoredFinishThumbnails,
} from "./FinishThumbnailStorage"
import {
  cachedFinishThumbnail,
  finishPreviewFillKey,
  renderFinishThumbnail,
} from "./FinishThumbnails"

const fill = { color: "#ff5b9a" }
const key = "glyphrise:finish-thumbnails:v2"
const png = "data:image/png;base64,cHJldmlldw=="

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.removeItem(key)
})

it("reuses real thumbnails from the previous visit without opening WebGL", async () => {
  localStorage.setItem(
    key,
    JSON.stringify({
      fillKey: finishPreviewFillKey(fill),
      thumbnails: { satin: png },
    })
  )
  expect(cachedFinishThumbnail("satin", fill)).toBe(png)
  expect(await renderFinishThumbnail("satin", fill)).toBe(png)
  expect(cachedFinishThumbnail("satin", { color: "#000000" })).toBeNull()
})

it("keeps only the latest fill and rejects malformed or external thumbnail data", () => {
  writeStoredFinishThumbnails({ fillKey: "old", thumbnails: { chrome: png } })
  writeStoredFinishThumbnails({ fillKey: "new", thumbnails: { satin: png } })
  expect(readStoredFinishThumbnails()).toEqual({
    fillKey: "new",
    thumbnails: { satin: png },
  })
  localStorage.setItem(
    key,
    JSON.stringify({
      fillKey: "new",
      thumbnails: {
        satin: "https://example.com/image.png",
        invalid: png,
        chrome: png,
      },
    })
  )
  expect(readStoredFinishThumbnails()?.thumbnails).toEqual({ chrome: png })
  localStorage.setItem(key, "malformed")
  expect(readStoredFinishThumbnails()).toBeNull()
})

it("ignores full or unavailable storage without affecting finish selection", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded")
  })
  expect(() =>
    writeStoredFinishThumbnails({ fillKey: "new", thumbnails: { satin: png } })
  ).not.toThrow()
})
