import { expect, test } from "../../../../../playwright/fixtures";
import { PwChart } from "@vuu-ui/vuu-playwright-helpers";

test.describe("PwChart", () => {
  test("THEN series names and categories are available", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/SimpleLineChart");
    const chart = await new PwChart(page).isReady();
    expect(await chart.seriesNames()).toEqual(["price", "volume"]);
    const categories = await chart.categories();
    expect(categories).toHaveLength(25);
    expect(categories[0]).toEqual("2026-04-02");
  });

  test("THEN data points can be located by index or category", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/SimpleLineChart");
    const chart = new PwChart(page);
    const byIndex = await chart.dataPoint("price", 3);
    const byCategory = await chart.dataPoint("price", byIndex.category);
    expect(byIndex.value).toEqual(103);
    expect(byIndex.isExcluded).toBe(false);
    expect(byCategory).toMatchObject({
      dataIndex: 3,
      value: 103,
      x: byIndex.x,
      y: byIndex.y,
    });
    await expect(byIndex.symbol).toHaveCount(1);
  });

  test("THEN locating a missing data point rejects", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/SimpleLineChart");
    const chart = new PwChart(page);
    await expect(chart.dataPoint("bid", 0)).rejects.toThrow('no series "bid"');
    await expect(chart.dataPoint("price", "1999-01-01")).rejects.toThrow(
      'no category "1999-01-01"',
    );
  });

  test("THEN hovering a data point enlarges its symbol", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/SimpleLineChart");
    const point = await new PwChart(page).dataPoint("price", 3);
    await expect(point.symbol).toHaveAttribute("transform", /^matrix\(3,/);
    await point.hover();
    await expect(point.symbol).toHaveAttribute("transform", /^matrix\(8,/);
  });

  test("THEN clicking a data point selects it, clicking again deselects", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/DataExclusions");
    const point = await new PwChart(page).dataPoint("price", 3);
    await point.click();
    await expect(point.symbol).toHaveAttribute("fill", "purple");
    await point.click();
    await expect(point.symbol).not.toHaveAttribute("fill", "purple");
  });
});

test.describe("WHEN chart has a context menu", () => {
  test("THEN right click on a data point shows the menu", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/DataExclusions");
    const chart = new PwChart(page);
    const menu = await chart.showContextMenu("price", 3);
    expect(await menu.hasMenuItems(["Exclude Item"])).toBe(true);
    await menu.close();
  });

  test("THEN Exclude Item excludes the data point, Include Item restores it", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/DataExclusions");
    const chart = new PwChart(page);
    expect((await chart.dataPoint("price", 3)).isExcluded).toBe(false);

    let menu = await chart.showContextMenu("price", 3);
    await menu.menuItem("Exclude Item").click();
    await menu.assertNotAttached();
    await expect
      .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
      .toBe(true);

    menu = await chart.showContextMenu("price", 3);
    expect(await menu.hasMenuItems(["Include Item"])).toBe(true);
    await menu.menuItem("Include Item").click();
    await expect
      .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
      .toBe(false);
  });

  test("THEN menu can be navigated with keyboard", async ({ mount, page }) => {
    await mount("Chart/LineChart/DataExclusions");
    const chart = new PwChart(page);
    const menu = await chart.showContextMenu("volume", 0);
    await menu.press("ArrowDown");
    await menu.assertFocusedMenuItem("Exclude Item");
    await menu.press("Enter");
    await menu.assertNotAttached();
    await expect
      .poll(async () => (await chart.dataPoint("volume", 0)).isExcluded)
      .toBe(true);
  });
});

test.describe("WHEN chart has no context menu", () => {
  test("THEN right click on a data point shows no menu", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/SimpleLineChart");
    await new PwChart(page).assertNoContextMenu("price", 3);
  });

  test("THEN EditableChart shows no menu in view mode", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/EditableChart");
    const chart = new PwChart(page);
    await chart.assertNoContextMenu("price", 3);
    await page.getByRole("radio", { name: "Edit" }).click();
    const menu = await chart.showContextMenu("price", 3);
    expect(await menu.hasMenuItems(["Exclude Item"])).toBe(true);
  });
});
