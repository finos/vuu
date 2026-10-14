import { expect, test } from "../../../../../playwright/fixtures";
import { PwTable, PwTableHeaderCell } from "@vuu-ui/vuu-playwright-helpers";

const RENDER_BUFFER = 5;
const ROW_COUNT = 1000;

test("PwTable headerCell exposes scoped header selection state", async ({
  page,
}) => {
  await page.setContent(`
    <div class="vuuTable" id="first-table">
      <div class="vuuTableHeaderCell" data-column-name="currency">Currency</div>
      <div class="vuuTableHeaderCell vuuTableHeaderCell-selected-extra"
           data-column-name="lotSize">Lot size</div>
      <div class="vuuTableHeaderCell vuuTableHeaderCell-selected"
           data-column-name="a&quot;b\\c">Quoted column</div>
    </div>
    <div class="vuuTable" id="second-table">
      <div class="vuuTableHeaderCell vuuTableHeaderCell-selected"
           data-column-name="currency">Currency</div>
    </div>
  `);

  const table = new PwTable(page, "#first-table");
  const header = table.headerCell("currency");
  expect(header).toBeInstanceOf(PwTableHeaderCell);
  expect(await header.isSelected).toBe(false);
  expect(await table.headerCell("lotSize").isSelected).toBe(false);
  expect(await table.headerCell('a"b\\c').isSelected).toBe(true);
  expect(
    await new PwTable(page, "#second-table").headerCell("currency").isSelected,
  ).toBe(true);
  expect(
    await new PwTableHeaderCell(
      page,
      '#second-table .vuuTableHeaderCell[data-column-name="currency"]',
    ).isSelected,
  ).toBe(true);

  await page
    .locator("#first-table .vuuTableHeaderCell")
    .first()
    .evaluate((element) =>
      element.classList.add("vuuTableHeaderCell-selected"),
    );
  expect(await header.isSelected).toBe(true);
  await header.assertSelected();
  await new PwTable(page, "#second-table")
    .headerCell("currency")
    .assertSelected();
});

test("PwTable cell locates by column name and aria row index", async ({
  page,
}) => {
  await page.setContent(`
    <div class="vuuTable">
      <div aria-rowindex="1">
        <div data-column-name="currency" aria-colindex="3">Currency</div>
      </div>
      <div aria-rowindex="2">
        <div aria-colindex="3">GBP</div>
      </div>
      <div aria-rowindex="3">
        <div aria-colindex="3">USD</div>
      </div>
    </div>
    <div class="vuuTable" id="other-table">
      <div aria-rowindex="1">
        <div data-column-name="currency" aria-colindex="1">Currency</div>
      </div>
      <div aria-rowindex="2">
        <div aria-colindex="1">EUR</div>
      </div>
    </div>
  `);

  const table = new PwTable(page, ".vuuTable:not(#other-table)");
  await expect(await table.cell("currency", 2)).toHaveText("GBP");
  await expect(await table.cell("currency", 3)).toHaveText("USD");
  await expect(await table.locateCell(2, "currency")).toHaveText("GBP");
  await expect(table.locateCell(2, 3)).toHaveText("GBP");

  const otherTable = new PwTable(page, "#other-table");
  await expect(await otherTable.cell("currency", 2)).toHaveText("EUR");
});

test.describe("WHEN it initially renders", () => {
  test("THEN expected className is present", async ({ mount, page }) => {
    await mount("Table/Modules/SIMUL/Instruments", {
      "data-testid": "table",
      height: 625,
      renderBufferSize: 5,
      width: 800,
    });
    const vuuTable = page.getByTestId("table");
    await expect(vuuTable).toContainClass("vuuTable");
  });

  test("THEN expected number of rows are present, with buffered rows, all with correct aria index", async ({
    mount,
    page,
  }) => {
    await mount("Table/Misc/TestTable");
    const table = new PwTable(page, '[data-testid="test-table"]');
    await table.assertRenderedRows(
      { from: 1, to: 30 },
      RENDER_BUFFER,
      ROW_COUNT,
    );
  });
});

test.describe("WHEN its datasource changes", () => {
  test("THEN it switches subscriptions, ignores late messages, and can switch back", async ({
    mount,
    page,
  }) => {
    await mount("Table/Misc/SwitchableDataSourceTable");
    const table = page.getByTestId("switchable-data-source-table");

    await expect(table).toContainText("source-value");

    await page.getByRole("button", { name: "Switch to session" }).click();
    await expect(table).toContainText("session-value");
    await expect(table).not.toContainText("source-value");

    await page.getByRole("button", { name: "Send late source update" }).click();
    await expect(table).toContainText("session-value");
    await expect(table).not.toContainText("late-source-value");

    await page.getByRole("button", { name: "Switch to source" }).click();
    await expect(table).toContainText("source-value-after-return");
    await expect(table).not.toContainText("session-value");
  });
});
