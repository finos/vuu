import type { Page } from "@playwright/test";
import { PwChart } from "@vuu-ui/vuu-playwright-helpers";
import { expect, test } from "../../../../../playwright/fixtures";

const EXAMPLE = "Chart/LineChart/EditableChartAndTable";

const showView = (page: Page, view: "Table" | "Chart") =>
  page.getByRole("radio", { name: view }).click();

const valueCell = (page: Page, value: string) =>
  page.locator(".ExcludableCell", { hasText: new RegExp(`^${value}$`) });

const isCellExcluded = async (page: Page, value: string) =>
  (await valueCell(page, value).getAttribute("data-excluded")) === "true";

test.describe("WHEN Table and Chart views share an edit session", () => {
  let pageErrors: string[] = [];
  test.beforeEach(({ page }) => {
    pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
  });
  test.afterEach(() => {
    expect(pageErrors).toEqual([]);
  });

  test("THEN edits made in either view are visible in the other, and saved", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

    // exclude in the table
    await valueCell(page, "101").click();
    await expect.poll(() => isCellExcluded(page, "101")).toBe(true);

    // the chart, mounted mid edit, shows the table edit
    await showView(page, "Chart");
    const chart = await new PwChart(page).isReady();
    await expect
      .poll(async () => (await chart.dataPoint("price", 1)).isExcluded)
      .toBe(true);

    // exclude in the chart
    const menu = await chart.showContextMenu("price", 3);
    await menu.menuItem("Exclude Item").click();
    await menu.assertNotAttached();
    await expect
      .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
      .toBe(true);

    // the table shows both edits, the session is still active
    await showView(page, "Table");
    await expect.poll(() => isCellExcluded(page, "101")).toBe(true);
    await expect.poll(() => isCellExcluded(page, "103")).toBe(true);
    await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible();
    await expect.poll(() => isCellExcluded(page, "101")).toBe(true);
    await expect.poll(() => isCellExcluded(page, "103")).toBe(true);

    // saved edits reach the chart, in view mode
    await showView(page, "Chart");
    await new PwChart(page).isReady();
    await expect
      .poll(async () => (await chart.dataPoint("price", 1)).isExcluded)
      .toBe(true);
    await expect
      .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
      .toBe(true);
  });

  test("THEN cancel discards edits made in both views", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    await valueCell(page, "101").click();
    await expect.poll(() => isCellExcluded(page, "101")).toBe(true);

    await showView(page, "Chart");
    const chart = await new PwChart(page).isReady();
    const menu = await chart.showContextMenu("price", 3);
    await menu.menuItem("Exclude Item").click();
    await expect
      .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
      .toBe(true);

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("button", { name: "Cancel" }),
    ).not.toBeVisible();
    await expect
      .poll(async () => (await chart.dataPoint("price", 3)).isExcluded)
      .toBe(false);
    await expect
      .poll(async () => (await chart.dataPoint("price", 1)).isExcluded)
      .toBe(false);

    await showView(page, "Table");
    await expect.poll(() => isCellExcluded(page, "101")).toBe(false);
    await expect.poll(() => isCellExcluded(page, "103")).toBe(false);
  });

  test("THEN a table click does not exclude outside an edit session", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await valueCell(page, "101").click();
    // give a stray edit time to land
    await page.waitForTimeout(200);
    expect(await isCellExcluded(page, "101")).toBe(false);
  });
});
