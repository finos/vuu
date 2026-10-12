import { expect, test } from "../../../../../playwright/fixtures";
import { TableOM } from "@vuu-ui/vuu-playwright-helpers";

// Reproduces a Retina display (device scale 2) zoomed to 150%. Emulated
// deviceScaleFactor does not affect layout limits, this launch flag does.
test.use({
  launchOptions: async ({ browserName }, use) =>
    use(
      browserName === "chromium"
        ? { args: ["--force-device-scale-factor=3"] }
        : {},
    ),
});

test.describe("Table with more rows than browser can scroll through natively", () => {
  test.describe("WHEN device scale factor is 3 and End key pressed", () => {
    test("THEN last row is rendered and visible", async ({
      browserName,
      mount,
      page,
    }) => {
      test.skip(browserName !== "chromium", "Chromium launch flag");

      await mount("Table/BigData/SimpleTableMillionRows");
      const table = new TableOM(page.getByRole("table"));

      const cell = table.locateCell(2, 1);
      await cell.click();
      await expect(cell).toBeFocused();
      await cell.press("End");

      await expect(table.locateCell(1_000_001, 1)).toBeVisible();
    });
  });
});
