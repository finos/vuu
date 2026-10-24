import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const examples = [
  ["CandlestickChart", "OhlcWithVolumeAndFills", "candlestick"],
  ["CandlestickChart", "OhlcTimeAxis", "candlestick"],
  ["CandlestickChart", "OhlcWithEChartsOptions", "candlestick"],
  ["CartesianChart", "TimeSeriesLine", "cartesian"],
  ["CartesianChart", "AreaWithVolumeBars", "cartesian"],
  ["CartesianChart", "SteppedArea", "cartesian"],
  ["CartesianChart", "VerticalBars", "cartesian"],
  ["CartesianChart", "HorizontalBars", "cartesian"],
  ["CartesianChart", "StackedBars", "cartesian"],
  ["CartesianChart", "TradesScatter", "cartesian"],
  ["DepthChart", "MarketDepth", "depth"],
  ["DepthChart", "MarketDepthCumSizeColumn", "depth"],
  ["HeatmapChart", "TradedVolumeHeatmap", "heatmap"],
  ["HeatmapChart", "PnlHeatmap", "heatmap"],
  ["HierarchyChart", "ExposureTreemap", "treemap"],
  ["HierarchyChart", "PnlSunburst", "sunburst"],
  ["HierarchyChart", "CurrencyPie", "pie"],
  ["HierarchyChart", "SectorDonut", "pie"],
] as const;

const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
};

test.describe("Trading chart examples", () => {
  for (const [file, example, chartType] of examples) {
    test(`renders ${file}/${example} without errors`, async ({
      mount,
      page,
    }) => {
      const errors = collectErrors(page);
      await mount(`Chart/${file}/${example}`);

      const chart = page.locator(`.vuuChart-${chartType}`).first();
      await expect(chart).toBeVisible();
      await expect(chart.locator("canvas").first()).toBeVisible();
      // allow a few ticks of streamed updates to be rendered
      await page.waitForTimeout(1200);
      expect(errors).toEqual([]);
    });
  }

  test("streams live updates into the market depth chart", async ({
    mount,
    page,
  }) => {
    await mount("Chart/DepthChart/MarketDepth");
    const canvas = page.locator(".vuuChart-depth canvas").first();
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(300);
    const before = await canvas.screenshot();
    await expect
      .poll(async () => (await canvas.screenshot()).equals(before), {
        timeout: 5000,
      })
      .toBe(false);
  });

  test("treemap click resolves grouped rows", async ({ mount, page }) => {
    await mount("Chart/HierarchyChart/ExposureTreemap");
    const canvas = page.locator(".vuuChart-treemap canvas").first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (!box) throw Error("no canvas");
    // top left area of the treemap is the largest leaf node
    await page.mouse.click(box.x + 40, box.y + 60);
    await expect(page.getByTestId("selected-item")).toHaveText(
      /.+ \/ .+ \(\d+ rows\)/,
    );
  });
});
