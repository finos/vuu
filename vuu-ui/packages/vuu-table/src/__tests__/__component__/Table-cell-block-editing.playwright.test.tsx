import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const EXAMPLE = "Table/Editing/EditableInstrumentsCellBlockEditing";

/** The cell of a column in a data row; the first data row is 1. */
const cell = (page: Page, row: number, column: string) =>
  page.locator(
    `[role="row"][aria-rowindex="${row + 1}"] [data-field="${column}"]`,
  );

const cellInput = (page: Page, row: number, column: string) =>
  cell(page, row, column).getByRole("textbox");

const undoButton = (page: Page) =>
  page.getByRole("button", { name: "Undo", exact: true });

const editMode = async (page: Page) => {
  await page.getByRole("radio", { name: "Edit" }).click();
  await expect(cellInput(page, 1, "lotSize")).toBeVisible();
};

/** Selects a block of cells with the mouse, from one cell to another. */
const selectCells = async (
  page: Page,
  [fromRow, fromColumn]: [number, string],
  [toRow, toColumn]: [number, string],
) => {
  const from = await cell(page, fromRow, fromColumn).boundingBox();
  const to = await cell(page, toRow, toColumn).boundingBox();
  if (from === null || to === null) throw Error("cells not visible");
  await page.mouse.move(from.x + 10, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + 10, to.y + to.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".vuuCellBlock")).toBeFocused();
};

const lotSizes = (page: Page, rows: number[]) =>
  Promise.all(rows.map((row) => cellInput(page, row, "lotSize").inputValue()));

test.describe("Table cell block editing", () => {
  test("Enter sets every cell of the block, as one change that Ctrl+Z undoes", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await editMode(page);
    const rows = [1, 2, 3];
    const before = await lotSizes(page, rows);
    await expect(undoButton(page)).toBeDisabled();

    await selectCells(page, [1, "lotSize"], [3, "lotSize"]);
    await page.keyboard.type("25");
    await expect(
      page.getByRole("textbox", { name: "Value for the selected cells" }),
    ).toHaveValue("25");
    await page.keyboard.press("Enter");

    for (const row of rows) {
      await expect(cellInput(page, row, "lotSize")).toHaveValue("25");
    }
    await expect(cellInput(page, 4, "lotSize")).not.toHaveValue("25");
    await expect(page.locator(".vuuCellBlock")).toBeFocused();
    await expect(undoButton(page)).toBeEnabled();

    await page.keyboard.press("ControlOrMeta+z");
    for (const [i, row] of rows.entries()) {
      await expect(cellInput(page, row, "lotSize")).toHaveValue(before[i]);
    }
    await expect(undoButton(page)).toBeDisabled();
  });

  test("cells that can't be edited are left as they are", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await editMode(page);
    const isin = await cell(page, 1, "isin").textContent();

    await selectCells(page, [1, "isin"], [2, "lotSize"]);
    await page.keyboard.type("7");
    await page.keyboard.press("Enter");

    await expect(cellInput(page, 1, "lotSize")).toHaveValue("7");
    await expect(cellInput(page, 2, "lotSize")).toHaveValue("7");
    await expect(cell(page, 1, "isin")).toHaveText(isin ?? "");
  });

  test("Escape closes the editor without editing", async ({ mount, page }) => {
    await mount(EXAMPLE);
    await editMode(page);
    const before = await lotSizes(page, [1, 2]);

    await selectCells(page, [1, "lotSize"], [2, "lotSize"]);
    await page.keyboard.type("9");
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("textbox", { name: "Value for the selected cells" }),
    ).toHaveCount(0);
    expect(await lotSizes(page, [1, 2])).toEqual(before);
    await expect(undoButton(page)).toBeDisabled();
  });

  test("Undo reverts an edit of a single cell", async ({ mount, page }) => {
    await mount(EXAMPLE);
    await editMode(page);
    const [before] = await lotSizes(page, [1]);

    const input = cellInput(page, 1, "lotSize");
    await input.dblclick();
    await input.fill("42");
    await input.press("Enter");
    await expect(input).toHaveValue("42");

    await undoButton(page).click();
    await expect(input).toHaveValue(before);
    await expect(undoButton(page)).toBeDisabled();
  });

  test("an arrow key moves away from the block and clears it", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await editMode(page);

    await selectCells(page, [1, "lotSize"], [3, "lotSize"]);
    await page.keyboard.type("25");
    await page.keyboard.press("Enter");
    await expect(page.locator(".vuuCellBlock")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".vuuCellBlock")).toHaveCount(0);
    await expect(page.locator(".vuuTableCell:focus")).toHaveCount(1);
  });

  test("a click on a cell clears the block", async ({ mount, page }) => {
    await mount(EXAMPLE);

    await selectCells(page, [1, "lotSize"], [3, "lotSize"]);
    await cell(page, 5, "currency").click();
    await expect(page.locator(".vuuCellBlock")).toHaveCount(0);
  });

  test("Shift and the arrow keys select a block to edit", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await editMode(page);

    await cellInput(page, 1, "lotSize").click();
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.up("Shift");
    await expect(page.locator(".vuuCellBlock")).toBeFocused();

    await page.keyboard.type("30");
    await page.keyboard.press("Enter");
    for (const row of [1, 2, 3]) {
      await expect(cellInput(page, row, "lotSize")).toHaveValue("30");
    }
    await expect(cellInput(page, 4, "lotSize")).not.toHaveValue("30");
  });

  test("Shift for an uppercase letter keeps the block", async ({
    mount,
    page,
  }) => {
    await mount(EXAMPLE);
    await editMode(page);

    await cellInput(page, 1, "lotSize").click();
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.up("Shift");
    const block = await page.locator(".vuuCellBlock").boundingBox();

    await page.keyboard.press("Shift+A");
    await expect(
      page.getByRole("textbox", { name: "Value for the selected cells" }),
    ).toHaveValue("A");
    expect(await page.locator(".vuuCellBlock").boundingBox()).toEqual(block);
  });

  test("a block of the key column can't be edited", async ({ mount, page }) => {
    await mount(EXAMPLE);
    await editMode(page);
    const rics = await Promise.all(
      [1, 2].map((row) => cellInput(page, row, "ric").inputValue()),
    );

    await selectCells(page, [1, "lotSize"], [2, "ric"]);
    await page.keyboard.type("8");
    await page.keyboard.press("Enter");
    await expect(cellInput(page, 1, "lotSize")).toHaveValue("8");
    await expect(cellInput(page, 2, "lotSize")).toHaveValue("8");
    for (const [i, row] of [1, 2].entries()) {
      await expect(cellInput(page, row, "ric")).toHaveValue(rics[i]);
    }

    await page.keyboard.press("ArrowRight");
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.up("Shift");
    await page.keyboard.type("X");
    await expect(
      page.getByRole("textbox", { name: "Value for the selected cells" }),
    ).toHaveCount(0);
  });
});
