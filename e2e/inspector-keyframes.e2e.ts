import { expect } from "@playwright/test"
import { test } from "./fixtures"

test("the Rotation label diamond toggles only its keyframe and supports undo", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.locator("#glyphrise-workspace")).toHaveAttribute(
    "aria-busy",
    "false"
  )
  await page.getByRole("button", { name: "Open file menu" }).click()
  await page.getByRole("menuitem", { name: "All files" }).click()
  await page.getByLabel("New file name").fill("Inspector diamond")
  await page.getByRole("button", { name: "Start blank" }).click()

  await page
    .getByRole("button", {
      name: "Add transform keyframe at 0.00s",
      exact: true,
    })
    .click()
  const time = page.getByRole("textbox", { name: "Playhead time in seconds" })
  await time.fill("1")
  await time.press("Enter")
  await page
    .getByRole("button", {
      name: "Add transform keyframe at 1.00s",
      exact: true,
    })
    .click()
  await time.fill("0")
  await time.press("Enter")

  // The hollow Scale indicator adds only Scale at an interpolated time.
  await time.fill("0.5")
  await time.press("Enter")
  const scaleRow = page.locator('[data-edit-property="Scale"]')
  const scaleKeys = page.getByRole("button", { name: /^Select Scale keyframe/ })
  await scaleRow
    .getByRole("button", {
      name: "Add Scale keyframe at 0.50s",
      exact: true,
    })
    .click()
  await expect(scaleKeys).toHaveCount(3)
  await expect(
    page.getByRole("button", { name: /^Select Rotation keyframe/ })
  ).toHaveCount(2)
  await expect(
    page.getByRole("button", { name: /^Select Move keyframe/ })
  ).toHaveCount(2)
  await scaleRow
    .getByRole("button", {
      name: "Remove Scale keyframe at 0.50s",
      exact: true,
    })
    .click()
  await expect(scaleKeys).toHaveCount(2)
  await time.fill("0")
  await time.press("Enter")

  const row = page.locator('[data-edit-property="Rotation"]')
  const rotationKeys = page.getByRole("button", {
    name: /^Select Rotation keyframe/,
  })
  await expect(rotationKeys).toHaveCount(2)
  await row
    .getByRole("button", {
      name: "Remove Rotation keyframe at 0.00s",
      exact: true,
    })
    .click()
  await expect(rotationKeys).toHaveCount(1)
  // Other Transform properties still have their keyframe here.
  await expect(
    page.getByRole("button", {
      name: "Remove transform keyframe at 0.00s",
      exact: true,
    })
  ).toBeVisible()
  await expect(
    row.getByRole("button", {
      name: "Add Rotation keyframe at 0.00s",
      exact: true,
    })
  ).toBeVisible()
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(rotationKeys).toHaveCount(2)
  await page.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(rotationKeys).toHaveCount(1)
  await row
    .getByRole("button", {
      name: "Add Rotation keyframe at 0.00s",
      exact: true,
    })
    .press("Enter")
  await expect(rotationKeys).toHaveCount(2)
})
