import { expect, type Locator } from "@playwright/test";
import { PwComponent } from "./PwComponent";
import { PwContextMenu } from "./PwContextMenu";
import { type ChartDataPointInfo, PwChartDataPoint } from "./PwChartDataPoint";

/**
 * The subset of the ECharts instance and option used by PwChart. The Vuu Chart
 * exposes its ECharts instance on the chart canvas element as echartsInstance.
 */
interface EChartsLike {
  convertToPixel(
    finder: { seriesId: string },
    value: [number, number],
  ): [number, number];
  getOption(): {
    series?: { id: string; name: string; data: { value: number | null }[] }[];
    xAxis?: { data?: string[] }[];
  };
}
type EChartsHostElement = HTMLElement & { echartsInstance?: EChartsLike };

/**
 * A Vuu Chart (VuuChart, an ECharts line chart). Data points are identified by
 * series name, which is the Vuu column name, and 0 based data index, which is
 * also the index of the category on the x axis.
 *
 * The chart must use the svg renderer for symbol locators (PwChartDataPoint.symbol).
 *
 * @example
 * test("chart renders price and volume", async ({ mount, page }) => {
 *   await mount("Chart/LineChart/SimpleLineChart");
 *   const chart = await new PwChart(page).isReady();
 *   expect(await chart.seriesNames()).toEqual(["price", "volume"]);
 *   const point = await chart.dataPoint("price", 0);
 *   expect(point.value).toEqual(100);
 * });
 */
export class PwChart extends PwComponent {
  protected readonly defaultCssSelector = ".vuuChart";

  /**
   * Locator for the element that renders the chart. This element receives
   * mouse events and holds the ECharts instance.
   *
   * @example
   * test("chart renders svg", async ({ page }) => {
   *   const chart = new PwChart(page);
   *   await expect(chart.canvas.locator("svg")).toBeVisible();
   * });
   */
  get canvas(): Locator {
    return this.locator.locator("[_echarts_instance_]");
  }

  /**
   * Wait until the chart is visible and has rendered series data. Resolves
   * with the chart, so it can be chained.
   *
   * @example
   * test("chart is ready", async ({ mount, page }) => {
   *   await mount("Chart/LineChart/SimpleLineChart");
   *   const chart = await new PwChart(page).isReady();
   *   expect(await chart.categories()).toHaveLength(25);
   * });
   */
  async isReady(options?: { timeout?: number }): Promise<this> {
    await super.isReady(options);
    await expect
      .poll(
        () =>
          this.canvas.evaluate((element: EChartsHostElement) =>
            (element.echartsInstance?.getOption().series ?? []).some(
              (series) => series.data.length > 0,
            ),
          ),
        options,
      )
      .toBe(true);
    return this;
  }

  /**
   * The names of the rendered series, in render order. These are the Vuu
   * column names of the series columns.
   *
   * @example
   * test("price only", async ({ page }) => {
   *   await page.getByRole("button", { name: "Price Only" }).click();
   *   const chart = await new PwChart(page).isReady();
   *   await expect.poll(() => chart.seriesNames()).toEqual(["price"]);
   * });
   */
  async seriesNames(): Promise<string[]> {
    await this.isReady();
    return this.canvas.evaluate((element: EChartsHostElement) => {
      const series = element.echartsInstance?.getOption().series ?? [];
      // excluded data items are rendered by a second series with the same name
      return Array.from(new Set(series.map(({ name }) => name)));
    });
  }

  /**
   * The category (x axis) values, in order.
   *
   * @example
   * test("first category", async ({ page }) => {
   *   const chart = await new PwChart(page).isReady();
   *   expect((await chart.categories())[0]).toEqual("2026-04-02");
   * });
   */
  async categories(): Promise<string[]> {
    await this.isReady();
    return this.canvas.evaluate(
      (element: EChartsHostElement) =>
        element.echartsInstance?.getOption().xAxis?.[0]?.data ?? [],
    );
  }

  /**
   * Locate a data point by series name and 0 based data index, or by category
   * (x axis) value. Waits for the chart to be ready. Rejects if the series or
   * data point does not exist, or the data point has no value.
   *
   * @param seriesName the series (Vuu column) name
   * @param dataIndexOrCategory 0 based data index, or category value
   *
   * @example
   * test("locate data points", async ({ page }) => {
   *   const chart = new PwChart(page);
   *   const byIndex = await chart.dataPoint("price", 3);
   *   const byCategory = await chart.dataPoint("price", "2026-04-05");
   *   expect(byIndex.value).toEqual(byCategory.value);
   * });
   */
  async dataPoint(
    seriesName: string,
    dataIndexOrCategory: number | string,
  ): Promise<PwChartDataPoint> {
    await this.isReady();
    const resolve = () =>
      this.resolveDataPoint(seriesName, dataIndexOrCategory);
    return new PwChartDataPoint(
      this.page,
      this.canvas,
      await resolve(),
      resolve,
    );
  }

  private async resolveDataPoint(
    seriesName: string,
    dataIndexOrCategory: number | string,
  ): Promise<ChartDataPointInfo> {
    const info = await this.canvas.evaluate(
      (element: EChartsHostElement, [seriesName, dataIndexOrCategory]) => {
        const chart = element.echartsInstance;
        if (!chart) {
          return "chart has no echartsInstance";
        }
        const { series = [], xAxis = [] } = chart.getOption();
        const categories = xAxis[0]?.data ?? [];
        const dataIndex =
          typeof dataIndexOrCategory === "number"
            ? dataIndexOrCategory
            : categories.indexOf(dataIndexOrCategory);
        if (dataIndex === -1) {
          return `no category "${dataIndexOrCategory}"`;
        }
        const namedSeries = series.filter(({ name }) => name === seriesName);
        if (namedSeries.length === 0) {
          return `no series "${seriesName}"`;
        }
        // An excluded data item has no value in the line series (id = seriesName),
        // its value is in the companion scatter series.
        const valueSeries = namedSeries.find(
          ({ data }) => typeof data[dataIndex]?.value === "number",
        );
        if (!valueSeries) {
          return `series "${seriesName}" has no value at data index ${dataIndex}`;
        }
        const value = valueSeries.data[dataIndex].value as number;
        const [x, y] = chart.convertToPixel({ seriesId: valueSeries.id }, [
          dataIndex,
          value,
        ]);
        return {
          seriesName,
          dataIndex,
          category: categories[dataIndex],
          value,
          isExcluded: valueSeries.id !== seriesName,
          x,
          y,
        } satisfies ChartDataPointInfo;
      },
      [seriesName, dataIndexOrCategory] as const,
    );
    if (typeof info === "string") {
      throw Error(`PwChart, dataPoint, ${info}`);
    }
    return info;
  }

  /**
   * Right click a data point to invoke the context menu. Resolves once the
   * menu is visible and has focus. Waits until the test timeout if no context
   * menu is shown, use assertNoContextMenu to test for that.
   *
   * @param seriesName the series (Vuu column) name
   * @param dataIndexOrCategory 0 based data index, or category value
   *
   * @example
   * test("exclude data point", async ({ mount, page }) => {
   *   await mount("Chart/LineChart/DataExclusions");
   *   const chart = new PwChart(page);
   *   const menu = await chart.showContextMenu("price", 3);
   *   expect(await menu.hasMenuItems(["Exclude Item"])).toBe(true);
   *   await menu.menuItem("Exclude Item").click();
   *   await expect
   *     .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
   *     .toBe(true);
   * });
   */
  async showContextMenu(
    seriesName: string,
    dataIndexOrCategory: number | string,
  ): Promise<PwContextMenu> {
    const dataPoint = await this.dataPoint(seriesName, dataIndexOrCategory);
    return dataPoint.showContextMenu();
  }

  /**
   * Right click a data point and assert that no context menu is shown. Waits
   * for the page to render after the right click before asserting, so it
   * cannot pass before a menu would have appeared.
   *
   * @param seriesName the series (Vuu column) name
   * @param dataIndexOrCategory 0 based data index, or category value
   *
   * @example
   * test("no context menu in view mode", async ({ mount, page }) => {
   *   await mount("Chart/LineChart/EditableChart");
   *   await new PwChart(page).assertNoContextMenu("price", 3);
   * });
   */
  async assertNoContextMenu(
    seriesName: string,
    dataIndexOrCategory: number | string,
  ): Promise<void> {
    const dataPoint = await this.dataPoint(seriesName, dataIndexOrCategory);
    await PwContextMenu.assertNotOpened(this.page, () =>
      dataPoint.click({ button: "right" }),
    );
  }
}
