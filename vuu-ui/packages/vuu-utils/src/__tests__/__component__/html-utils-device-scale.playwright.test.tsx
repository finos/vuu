import { test, expect } from "../../../../../playwright/fixtures";

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

test.describe("getMaxScrollHeight", () => {
  test.describe("WHEN device scale factor is 3", () => {
    test("THEN max scroll height is reduced to a third of Chromium's layout limit", async ({
      browserName,
      mount,
      page,
    }) => {
      test.skip(browserName !== "chromium", "Chromium launch flag");

      await mount("Table/TEST/MaxScrollHeight");
      const maxScrollHeight = Number(
        await page.getByTestId("max-scroll-height").textContent(),
      );
      expect(maxScrollHeight).toBeCloseTo(2 ** 25 / 3, -1);
    });
  });
});
