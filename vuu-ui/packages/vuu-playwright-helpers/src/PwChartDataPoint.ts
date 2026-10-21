import type { Locator, Page } from "@playwright/test";
import { PlaywrightPageObject } from "./PlaywrightPageObject";
import { PwContextMenu } from "./PwContextMenu";

/**
 * Position and value of a chart data point, as resolved by PwChart.
 */
export interface ChartDataPointInfo {
  seriesName: string;
  /**
   * 0 based index into the series data (and the category axis).
   */
  dataIndex: number;
  /**
   * The category (x axis) value at dataIndex.
   */
  category: string;
  value: number;
  /**
   * True when the data point is rendered as an excluded data item.
   */
  isExcluded: boolean;
  /**
   * Pixel position of the data point, relative to the chart canvas.
   */
  x: number;
  y: number;
}

/**
 * A single data point within a PwChart. Obtained from PwChart.dataPoint.
 *
 * The properties (value, x, y etc) are a snapshot, taken when the data point is
 * obtained. Interactions (click, hover, right click) are performed with the
 * mouse at the data point's current position, which is resolved again before
 * each action, waiting until the position is stable (e.g. while the chart is
 * resizing). This mirrors Playwright Locator actionability checks.
 *
 * @example
 * test("select a data point", async ({ page }) => {
 *   const chart = new PwChart(page);
 *   const point = await chart.dataPoint("price", 3);
 *   expect(point.value).toEqual(103);
 *   await point.click();
 *   await expect(point.symbol).toHaveAttribute("fill", "purple");
 * });
 */
export class PwChartDataPoint
  extends PlaywrightPageObject
  implements ChartDataPointInfo
{
  readonly seriesName: string;
  readonly dataIndex: number;
  readonly category: string;
  readonly value: number;
  readonly isExcluded: boolean;
  readonly x: number;
  readonly y: number;

  /**
   * @param page the Playwright page
   * @param canvas Locator for the element that renders the chart (and receives mouse events)
   * @param info position and value of the data point
   * @param resolve resolves the current position and value of the data point
   */
  constructor(
    page: Page,
    private readonly canvas: Locator,
    info: ChartDataPointInfo,
    private readonly resolve: () => Promise<ChartDataPointInfo>,
  ) {
    super(page);
    this.seriesName = info.seriesName;
    this.dataIndex = info.dataIndex;
    this.category = info.category;
    this.value = info.value;
    this.isExcluded = info.isExcluded;
    this.x = info.x;
    this.y = info.y;
  }

  /**
   * Locator for the symbol rendered at this data point (an SVG path, requires
   * the svg renderer). Matched by position only, so its size and color can be
   * asserted as they change, e.g. on hover or selection. Uses the position
   * when the data point was obtained.
   *
   * @example
   * test("hover enlarges symbol", async ({ page }) => {
   *   const point = await new PwChart(page).dataPoint("price", 3);
   *   await expect(point.symbol).toBeAttached();
   *   await point.hover();
   *   await expect(point.symbol).toHaveAttribute("transform", /^matrix\(8,/);
   * });
   */
  get symbol(): Locator {
    // ECharts renders symbols with transform="matrix(s,0,0,s,x,y)", where
    // (x,y) is the data point position, to 4 decimal places.
    const position = `,${round(this.x)},${round(this.y)})`;
    return this.canvas.locator(`svg path[transform$="${position}"]`);
  }

  /**
   * Click the data point. With a chart selectionModel, this toggles selection.
   *
   * @example
   * test("click selects data point", async ({ page }) => {
   *   const point = await new PwChart(page).dataPoint("price", 3);
   *   await point.click();
   *   await expect(point.symbol).toHaveAttribute("fill", "purple");
   * });
   */
  async click(
    options?: Omit<Parameters<Locator["click"]>[0], "position">,
  ): Promise<void> {
    const position = await this.stablePosition();
    await this.canvas.click({ ...options, position });
  }

  /**
   * Move the mouse over the data point.
   *
   * @example
   * test("hover highlights data point", async ({ page }) => {
   *   const point = await new PwChart(page).dataPoint("price", 3);
   *   await point.hover();
   *   await expect(point.symbol).toHaveAttribute("transform", /^matrix\(8,/);
   * });
   */
  async hover(): Promise<void> {
    await this.canvas.hover({ position: await this.stablePosition() });
  }

  /**
   * Right click the data point to invoke the context menu. Resolves once the
   * menu is visible and has focus.
   *
   * @example
   * test("exclude data point", async ({ page }) => {
   *   const point = await new PwChart(page).dataPoint("price", 3);
   *   const menu = await point.showContextMenu();
   *   await menu.menuItem("Exclude Item").click();
   * });
   */
  showContextMenu(): Promise<PwContextMenu> {
    return PwContextMenu.open(this.page, () => this.click({ button: "right" }));
  }

  /**
   * The current position of the data point, once it has stopped moving.
   */
  private async stablePosition(): Promise<{ x: number; y: number }> {
    let { x, y } = await this.resolve();
    for (let attempt = 0; attempt < MAX_STABLE_ATTEMPTS; attempt++) {
      await nextAnimationFrames(this.page);
      const current = await this.resolve();
      if (current.x === x && current.y === y) {
        return { x, y };
      }
      ({ x, y } = current);
    }
    throw Error(
      `PwChartDataPoint, ${this.seriesName}[${this.dataIndex}] position is not stable`,
    );
  }
}

const MAX_STABLE_ATTEMPTS = 50;

const round = (value: number) => parseFloat(value.toFixed(4));

const nextAnimationFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
