import { expect, type Locator } from "@playwright/test";
import type { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { PwComponent } from "./PwComponent";
import { PwContextMenu } from "./PwContextMenu";
import { PwTableHeaderCell } from "./PwTableHeaderCell";
import { byDataIcon, cssAttributeValue } from "./selector-utils";

type AriaRole = "cell" | "textbox" | "combobox";

const byAriaRowIndex = (ariaRowIndex: number) =>
  `[aria-rowindex="${ariaRowIndex}"]:scope`;

const xpathStringLiteral = (value: string) => {
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  if (!value.includes('"')) {
    return `"${value}"`;
  }
  return `concat('${value.split("'").join(`', "'", '`)}')`;
};

/**
 * A Vuu Table. Rows are located by 1-based aria row index, which includes
 * header rows (with one header, the first data row is 2).
 *
 * @example
 * test("table renders instruments", async ({ mount, page }) => {
 *   await mount("Table/ContextMenu/LocalContextMenu");
 *   const table = new PwTable(page);
 *   await table.assertVisible();
 *   await expect(await table.cell("ric", 2)).toHaveText("AAOO.L");
 * });
 */
export class PwTable extends PwComponent {
  protected readonly defaultCssSelector = ".vuuTable";

  /**
   * Locator for the scrollable content container (the rendered rows).
   *
   * @example
   * test("rows are zebra striped", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await expect(table.contentContainer).toContainClass("vuuTable-zebra");
   * });
   */
  get contentContainer() {
    return this.locator.locator(".vuuTable-contentContainer");
  }

  /**
   * Locator for the scrollbar container, the element that scrolls.
   *
   * @example
   * test("scrolls vertically", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.scrollbarContainer.evaluate((el) => el.scrollTo(0, 1000));
   *   await expect(table.row(2)).not.toBeInViewport();
   * });
   */
  get scrollbarContainer() {
    return this.locator.locator(".vuuTable-scrollbarContainer");
  }

  /**
   * Row Locator by 1-based aria row index, including headers.
   *
   * @example
   * test("first data row is selected", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await (await table.cell("ric", 2)).click();
   *   await expect(table.row(2)).toHaveAttribute("aria-selected", "true");
   * });
   */
  row(row: number) {
    return this.locator.locator(`[aria-rowindex="${row}"]`);
  }

  /**
   * Locate cell by column name and 1-based aria row index, including headers.
   * Preferred over locateCell for new usage.
   *
   * @example
   * test("first ric", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await expect(await table.cell("ric", 2)).toHaveText("AAOO.L");
   * });
   */
  cell(colName: string, ariaRowIndex: number): Promise<Locator> {
    return this.locateCell(ariaRowIndex, colName);
  }

  /**
   * Double click a cell to edit it, fill the editor with value, then commit
   * (Enter) or cancel (Escape) the edit.
   *
   * @example
   * test("edit bbg", async ({ mount, page }) => {
   *   await mount("Table/Editing/EditableInstrumentsInlineEdit");
   *   await page.getByRole("radio", { name: "Edit" }).click();
   *   const table = new PwTable(page);
   *   const textbox = (await table.cell("bbg", 2)).getByRole("textbox");
   *   await table.editCell("bbg", 2, "X", "cancel");
   *   await expect(textbox).not.toHaveValue("X");
   *   await table.editCell("bbg", 2, "X");
   *   await expect(textbox).toHaveValue("X");
   * });
   */
  async editCell(
    columnName: string,
    ariaRowIndex: number,
    value: string,
    action: "commit" | "cancel" = "commit",
  ): Promise<void> {
    const cell = await this.cell(columnName, ariaRowIndex);
    await cell.dblclick();
    const textbox = cell.getByRole("textbox");
    await textbox.fill(value);
    await expect(textbox).toHaveValue(value);
    await textbox.press(action === "commit" ? "Enter" : "Escape");
  }

  /**
   * The labels displayed in the column headers, in rendered order.
   * Header cells without a label (e.g. the checkbox selection column) are omitted.
   *
   * @example
   * test("renders expected columns", async ({ page }) => {
   *   const table = new PwTable(page);
   *   expect(await table.columnNames()).toEqual(["Ccy", "Exchange", "Price"]);
   * });
   */
  async columnNames(): Promise<string[]> {
    return this.locator
      .locator(".vuuTableHeaderCell .vuuTableHeaderCell-label")
      .allTextContents();
  }

  /**
   * The total row count, read from aria-rowcount on the element with role="table".
   * This is the dataSource size, not the number of rendered rows.
   *
   * @example
   * test("loads all instruments", async ({ page }) => {
   *   const table = new PwTable(page);
   *   expect(await table.rowCount()).toEqual(1000);
   * });
   */
  async rowCount(): Promise<number> {
    const ariaRowCount = await this.locator
      .getByRole("table")
      .getAttribute("aria-rowcount");
    if (ariaRowCount === null) {
      throw Error("PwTable, rowCount, table does not have an aria-rowcount");
    }
    return parseInt(ariaRowCount, 10);
  }

  /**
   * Locate the icon with the given data-icon name within a cell.
   *
   * @example
   * test("flags stale prices", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await expect(await table.cellIcon("status", 3, "warning")).toBeVisible();
   * });
   */
  async cellIcon(
    columnName: string,
    ariaRowIndex: number,
    iconName: string,
  ): Promise<Locator> {
    const cell = await this.cell(columnName, ariaRowIndex);
    return cell.locator(byDataIcon(iconName));
  }

  /**
   * Locate all rendered (non header) cells containing an icon with the given
   * data-icon name. Each matching cell is counted once, however many such icons it holds.
   *
   * @example
   * test("flags stale prices", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await expect(table.cellsWithIcon("warning")).toHaveCount(4);
   * });
   */
  cellsWithIcon(iconName: string): Locator {
    return this.locator
      .getByRole("cell")
      .filter({ has: this.page.locator(byDataIcon(iconName)) });
  }

  /**
   * The column header cell for the named column.
   *
   * @example
   * test("currency column not selected", async ({ page }) => {
   *   const table = new PwTable(page);
   *   expect(await table.headerCell("currency").isSelected).toBe(false);
   * });
   */
  headerCell(columnName: string): PwTableHeaderCell {
    return new PwTableHeaderCell(
      this.page,
      this.locator.locator(
        `.vuuTableHeaderCell[data-column-name="${cssAttributeValue(columnName)}"]`,
      ),
    );
  }

  /**
   * Right click a cell to invoke the context menu. Resolves once the menu is
   * visible and has focus, so keyboard navigation can begin immediately.
   * Waits until the test timeout if no context menu is shown, use
   * assertNoContextMenu to test for that.
   *
   * @param columnName name of the column
   * @param ariaRowIndex 1-based aria row index, including headers (with one header, the first data row is 2)
   *
   * @example
   * test("shows cell menu", async ({ page }) => {
   *   const table = new PwTable(page);
   *   const menu = await table.showContextMenu("ric", 2);
   *   expect(await menu.menuItem("Copy text").isEnabled()).toBe(true);
   * });
   */
  async showContextMenu(
    columnName: string,
    ariaRowIndex: number,
  ): Promise<PwContextMenu> {
    const cell = await this.cell(columnName, ariaRowIndex);
    return PwContextMenu.open(this.page, () => cell.click({ button: "right" }));
  }

  /**
   * Right click a cell and assert that no context menu is shown and the cell
   * is not marked as having an open context menu.
   *
   * A negative assertion passes as soon as the menu is absent, which may be
   * before a menu would have rendered. To avoid false passes we wait for two
   * animation frames after the right click, allowing React to commit and the
   * menu to be positioned, before asserting.
   *
   * @param columnName name of the column
   * @param ariaRowIndex 1-based aria row index, including headers (with one header, the first data row is 2)
   *
   * @example
   * test("no menu when none configured", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.assertNoContextMenu("ccy", 2);
   * });
   */
  async assertNoContextMenu(
    columnName: string,
    ariaRowIndex: number,
  ): Promise<void> {
    const cell = await this.cell(columnName, ariaRowIndex);
    await PwContextMenu.assertNotOpened(this.page, () =>
      cell.click({ button: "right" }),
    );
    await expect(cell).not.toContainClass("ContextOpen");
  }

  /**
   * Locate cell(s) by accessible name (cell contents). May match several cells.
   *
   * @example
   * test("right click ric", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.locateCell("AAOP N").click({ button: "right" });
   * });
   */
  locateCell(text: string): Locator;
  /**
   * Locate cell by 1-based aria row index and 1-based aria col index.
   *
   * @example
   * test("down arrow from header focuses first cell", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.locateColumnHeader(1).press("ArrowDown");
   *   await expect(table.locateCell(2, 1)).toBeFocused();
   * });
   */
  locateCell(row: number, column: number): Locator;
  /**
   * Locate cell by 1-based aria row index and column name. Prefer cell(columnName, ariaRowIndex).
   *
   * @example
   * test("first ric", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await expect(await table.locateCell(2, "ric")).toHaveText("AAOO.L");
   * });
   */
  locateCell(row: number, columnName: string): Promise<Locator>;
  locateCell(rowOrText: number | string, column?: number | string) {
    if (typeof rowOrText === "number" && typeof column === "number") {
      return this.locator.locator(
        `[aria-rowindex="${rowOrText}"] > [aria-colindex="${column}"]`,
      );
    } else if (typeof rowOrText === "number" && typeof column === "string") {
      const columnHeader = this.locator
        .locator(`xpath=.//*[@data-column-name=${xpathStringLiteral(column)}]`)
        .first();
      return columnHeader.getAttribute("aria-colindex").then((ariaColIndex) => {
        if (ariaColIndex === null) {
          throw Error(
            `PwTable, locateCell, column "${column}" does not have an aria-colindex`,
          );
        }
        return this.locator.locator(
          `[aria-rowindex="${rowOrText}"] > [aria-colindex="${ariaColIndex}"]`,
        );
      });
    } else if (typeof rowOrText === "string") {
      return this.locator.getByRole("cell", { name: rowOrText });
    }
  }

  /**
   * Locate a column header cell by 1-based aria col index.
   *
   * @example
   * test("click header focuses it", async ({ page }) => {
   *   const table = new PwTable(page);
   *   const header = table.locateColumnHeader(1);
   *   await header.click();
   *   await expect(header).toBeFocused();
   * });
   */
  locateColumnHeader(column: number) {
    return this.locateCell(1, column);
  }

  /**
   * When isEditable is true, assert the cell is editable but not currently in
   * edit mode and, if value is passed, that its textbox has that value. When
   * isEditable is false or undefined, nothing is asserted.
   *
   * @example
   * test("first cell is editable", async ({ mount, page }) => {
   *   await mount("Table/Editing/EditableInstruments");
   *   await page.getByRole("radio", { name: "Edit" }).click();
   *   const table = new PwTable(page);
   *   await table.assertCellIsEditable(2, 1, true, "AAOO L");
   * });
   */
  async assertCellIsEditable(
    row: number,
    column: number,
    isEditable: boolean | undefined,
    value?: string,
  ) {
    const cell = this.locateCell(row, column);
    if (isEditable) {
      await expect(cell).toContainClass("vuuTableCell-editable");
      await expect(cell).not.toContainClass("vuuEditing");

      if (typeof value === "string") {
        const input = cell.getByRole("textbox");
        await expect(input).toHaveValue(value);
      }
    }
  }

  private getCellText(
    arg1: number | Locator,
    arg2: number | string,
    arg3?: string | AriaRole,
    arg4?: AriaRole,
  ): [Locator, string, AriaRole | undefined] {
    if (typeof arg1 === "number" && typeof arg2 === "number") {
      return [this.locateCell(arg1, arg2), arg3 as string, arg4];
    }
    return [arg1 as Locator, arg2 as string, arg3 as AriaRole | undefined];
  }

  /**
   * Assert the value of a cell input (toHaveValue). Pass a role to target an
   * element within the cell, e.g. "textbox" for an editable cell.
   *
   * @example
   * test("editable cell value", async ({ mount, page }) => {
   *   await mount("Table/Editing/EditableInstruments");
   *   await page.getByRole("radio", { name: "Edit" }).click();
   *   const table = new PwTable(page);
   *   await table.assertCellValue(2, 1, "AAOO L", "textbox");
   *   await table.assertCellValue(table.locateCell(2, 1), "AAOO L", "textbox");
   * });
   */
  async assertCellValue(
    cell: Locator,
    text: string,
    role?: AriaRole,
  ): Promise<void>;
  async assertCellValue(
    row: number,
    column: number,
    text: string,
    role?: AriaRole,
  ): Promise<void>;
  async assertCellValue(
    arg1: number | Locator,
    arg2: number | string,
    arg3?: string | AriaRole,
    arg4?: AriaRole,
  ) {
    const [cell, text, role] = this.getCellText(arg1, arg2, arg3, arg4);
    const target = role ? cell.getByRole(role) : cell;

    if (target) {
      await expect(target).toHaveValue(text);
    } else {
      throw Error("PwTable, assertCellValue, invalid parameters");
    }
  }

  /**
   * Assert the text content of a cell (toHaveText). Pass a role to target an
   * element within the cell, e.g. "combobox" for a dropdown cell.
   *
   * @example
   * test("first cell text", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.assertCellContent(2, 1, "AAOO L");
   *   await table.assertCellContent(table.locateCell(2, 1), "AAOO L");
   * });
   */
  async assertCellContent(
    cell: Locator,
    text: string,
    role?: AriaRole,
  ): Promise<void>;
  async assertCellContent(
    row: number,
    column: number,
    text: string,
    role?: AriaRole,
  ): Promise<void>;
  async assertCellContent(
    arg1: number | Locator,
    arg2: number | string,
    arg3?: string | AriaRole,
    arg4?: AriaRole,
  ) {
    const [cell, text, role] = this.getCellText(arg1, arg2, arg3, arg4);
    const target = role ? cell.getByRole(role) : cell;

    if (target) {
      await expect(target).toHaveText(text);
    } else {
      throw Error("PwTable, assertCellContent, invalid parameters");
    }
  }

  /**
   * Assert a cell, or an element within it with the given role, is focused.
   *
   * @example
   * test("click focuses editable cell", async ({ mount, page }) => {
   *   await mount("Table/Editing/EditableInstruments");
   *   await page.getByRole("radio", { name: "Edit" }).click();
   *   const table = new PwTable(page);
   *   const cell = table.locateCell(3, 3);
   *   await cell.click();
   *   await table.assertCellIsFocused(cell, "textbox");
   *   await table.assertCellIsFocused(3, 3, "textbox");
   * });
   */
  async assertCellIsFocused(cell: Locator, role?: AriaRole): Promise<void>;
  async assertCellIsFocused(
    row: number,
    column: number,
    role?: AriaRole,
  ): Promise<void>;
  async assertCellIsFocused(
    rowOrCell: number | Locator,
    columnOrRole?: number | AriaRole,
    role?: AriaRole,
  ) {
    let target: Locator | undefined;
    if (typeof rowOrCell === "number" && typeof columnOrRole === "number") {
      const cell = this.locateCell(rowOrCell, columnOrRole);
      target = role ? cell.getByRole(role) : cell;
    } else if (typeof rowOrCell !== "number") {
      target =
        columnOrRole && typeof columnOrRole !== "number"
          ? rowOrCell.getByRole(columnOrRole)
          : rowOrCell;
    }

    if (target) {
      await expect(target).toBeFocused();
    } else {
      throw Error("PwTable, assertCellIsFocused, invalid parameters");
    }
  }

  /**
   * Assert a cell is (default) or is not in edit mode.
   *
   * @example
   * test("Enter starts editing, Escape stops", async ({ mount, page }) => {
   *   await mount("Table/Editing/EditableInstruments");
   *   await page.getByRole("radio", { name: "Edit" }).click();
   *   const table = new PwTable(page);
   *   const cell = table.locateCell(3, 3);
   *   await cell.click();
   *   await cell.press("Enter");
   *   await table.assertCellIsEditing(cell);
   *   await cell.press("Escape");
   *   await table.assertCellIsEditing(cell, false);
   * });
   */
  async assertCellIsEditing(cell: Locator, isEditing?: boolean): Promise<void>;
  async assertCellIsEditing(
    row: number,
    column: number,
    isEditing?: boolean,
  ): Promise<void>;
  async assertCellIsEditing(
    rowOrCell: number | Locator,
    columnOrEditing?: number | boolean,
    isEditing?: boolean,
  ) {
    let target: Locator | undefined;
    let editing = true;
    if (typeof rowOrCell === "number" && typeof columnOrEditing === "number") {
      target = this.locateCell(rowOrCell, columnOrEditing);
      if (typeof isEditing === "boolean") {
        editing = isEditing;
      }
    } else if (typeof rowOrCell !== "number") {
      target = rowOrCell;
      if (typeof columnOrEditing === "boolean") {
        editing = columnOrEditing;
      }
    }
    if (target) {
      const editControl = ".saltInput";
      if (editing) {
        return expect(target.locator(editControl)).toContainClass("vuuEditing");
      } else {
        return expect(target.locator(editControl)).not.toContainClass(
          "vuuEditing",
        );
      }
    } else {
      throw Error("PwTable, assertCellIsEditing, invalid parameters");
    }
  }

  /**
   * Assert which rows are rendered, given the visible range of data rows.
   * Checks the rendered row count includes the leading and trailing buffers
   * and that buffered rows beyond the viewport are not in view.
   *
   * @param range the visible range of (0-based) data rows
   * @param renderBufferSize number of rows rendered beyond each end of the viewport
   * @param totalRowCount size of the dataSource
   * @param headerCount number of header rows, default 1
   *
   * @example
   * test("initial render", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.assertRenderedRows({ from: 0, to: 30 }, 5, 1000);
   * });
   */
  async assertRenderedRows(
    { from, to }: VuuRange,
    renderBufferSize: number,
    totalRowCount: number,
    headerCount = 1,
  ) {
    const leadingBufferedRows =
      from < renderBufferSize ? from : renderBufferSize;
    const offsetFromEnd = totalRowCount - to;
    const trailingBufferedRows =
      offsetFromEnd < renderBufferSize
        ? Math.min(0, offsetFromEnd)
        : renderBufferSize;
    const renderedRowCount =
      to - from + leadingBufferedRows + trailingBufferedRows;

    await expect(this.locator.getByRole("row")).toHaveCount(
      renderedRowCount + headerCount,
    );

    // we use the aria index for locators, which is 1 based and includes headers
    const firstRenderedRow = from - leadingBufferedRows + headerCount + 1;
    const lastVisibleRow = to + headerCount;
    const lastRenderedRow = to + headerCount + trailingBufferedRows;

    await expect(
      this.locator.getByRole("row").locator(byAriaRowIndex(firstRenderedRow)),
    ).toBeVisible();
    await expect(
      this.locator.getByRole("row").locator(byAriaRowIndex(lastVisibleRow)),
    ).toBeVisible();

    if (trailingBufferedRows > 0) {
      await expect(
        this.locator
          .getByRole("row")
          .locator(byAriaRowIndex(lastVisibleRow + 1)),
      ).not.toBeInViewport();
      await expect(
        this.locator.getByRole("row").locator(byAriaRowIndex(lastRenderedRow)),
      ).not.toBeInViewport();
      await expect(
        this.locator
          .getByRole("row")
          .locator(byAriaRowIndex(lastRenderedRow + 1)),
      ).not.toBeAttached();
    }
  }

  /**
   * Assert which columns are rendered and which are in the viewport, checked
   * against the first data row. Ranges are inclusive, 1-based aria col indexes.
   *
   * @example
   * test("column virtualization", async ({ page }) => {
   *   const table = new PwTable(page);
   *   await table.assertRenderedColumns({
   *     rendered: { from: 1, to: 8 },
   *     visible: { from: 1, to: 6 },
   *   });
   * });
   */
  async assertRenderedColumns({
    rendered,
    visible,
  }: {
    rendered: VuuRange;
    visible: VuuRange;
  }) {
    const { from: firstRendered, to: lastRendered } = rendered;
    const renderedColumnCount = lastRendered - firstRendered + 1;

    await expect(this.row(2).getByRole("cell")).toHaveCount(
      renderedColumnCount,
    );

    const { from: firstVisible, to: lastVisible } = visible;

    await expect(this.locateCell(2, firstVisible)).toBeInViewport();
    await expect(this.locateCell(2, lastVisible)).toBeInViewport();

    if (lastRendered > lastVisible) {
      await expect(this.locateCell(2, lastVisible + 1)).not.toBeInViewport();
    }
  }
}
