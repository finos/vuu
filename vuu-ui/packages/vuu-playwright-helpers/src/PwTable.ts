import { expect, type Locator, type Page } from "@playwright/test";
import type { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { PlaywrightPageObject } from "./PlaywrightPageObject";
import { PwTableHeaderCell } from "./PwTableHeaderCell";

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

// escape a value for use inside a double-quoted CSS attribute selector
const cssAttributeValue = (value: string) =>
  Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return character === '"' || character === "\\" || code < 32 || code === 127
      ? `\\${code.toString(16)} `
      : character;
  }).join("");

const byDataIcon = (iconName: string) =>
  `[data-icon="${cssAttributeValue(iconName)}"]`;

export class PwTable extends PlaywrightPageObject {
  protected readonly defaultCssSelector = ".vuuTable";

  /**
   * @param page the Playwright page
   * @param cssSelector optional selector for the Table, overrides defaultCssSelector
   */
  constructor(
    page: Page,
    private readonly cssSelector?: string,
  ) {
    super(page);
  }

  get #locator(): Locator {
    return this.page.locator(this.cssSelector ?? this.defaultCssSelector);
  }

  get contentContainer() {
    return this.#locator.locator(".vuuTable-contentContainer");
  }

  get scrollbarContainer() {
    return this.#locator.locator(".vuuTable-scrollbarContainer");
  }

  /**
   * row Locator by aria-index
   */
  row(row: number) {
    return this.#locator.locator(`[aria-rowindex="${row}"]`);
  }

  /**
   * Locate cell by column name and 1-based aria row index, including headers.
   */
  cell(colName: string, ariaRowIndex: number): Promise<Locator> {
    return this.locateCell(ariaRowIndex, colName);
  }

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
    return this.#locator
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
    const ariaRowCount = await this.#locator
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
    return this.#locator
      .getByRole("cell")
      .filter({ has: this.page.locator(byDataIcon(iconName)) });
  }

  headerCell(columnName: string): PwTableHeaderCell {
    return new PwTableHeaderCell(
      this.page,
      `${this.cssSelector ?? this.defaultCssSelector} >> .vuuTableHeaderCell[data-column-name="${cssAttributeValue(columnName)}"]`,
    );
  }

  /**
   * Locate cell by cell contents
   * @param text
   */
  locateCell(text: string): Locator;
  /**
   * Locate cell by aria row index and aria col index
   * @param text
   */
  locateCell(row: number, column: number): Locator;
  /**
   * Locate cell by aria row index and column name
   */
  locateCell(row: number, columnName: string): Promise<Locator>;
  locateCell(rowOrText: number | string, column?: number | string) {
    if (typeof rowOrText === "number" && typeof column === "number") {
      return this.#locator.locator(
        `[aria-rowindex="${rowOrText}"] > [aria-colindex="${column}"]`,
      );
    } else if (typeof rowOrText === "number" && typeof column === "string") {
      const columnHeader = this.#locator
        .locator(`xpath=.//*[@data-column-name=${xpathStringLiteral(column)}]`)
        .first();
      return columnHeader.getAttribute("aria-colindex").then((ariaColIndex) => {
        if (ariaColIndex === null) {
          throw Error(
            `PwTable, locateCell, column "${column}" does not have an aria-colindex`,
          );
        }
        return this.#locator.locator(
          `[aria-rowindex="${rowOrText}"] > [aria-colindex="${ariaColIndex}"]`,
        );
      });
    } else if (typeof rowOrText === "string") {
      return this.#locator.getByRole("cell", { name: rowOrText });
    }
  }

  locateColumnHeader(column: number) {
    return this.locateCell(1, column);
  }

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

  async assertVisible() {
    return expect(this.#locator).toBeVisible();
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

    await expect(this.#locator.getByRole("row")).toHaveCount(
      renderedRowCount + headerCount,
    );

    // we use the aria index for locators, which is 1 based and includes headers
    const firstRenderedRow = from - leadingBufferedRows + headerCount + 1;
    const lastVisibleRow = to + headerCount;
    const lastRenderedRow = to + headerCount + trailingBufferedRows;

    await expect(
      this.#locator.getByRole("row").locator(byAriaRowIndex(firstRenderedRow)),
    ).toBeVisible();
    await expect(
      this.#locator.getByRole("row").locator(byAriaRowIndex(lastVisibleRow)),
    ).toBeVisible();

    if (trailingBufferedRows > 0) {
      await expect(
        this.#locator
          .getByRole("row")
          .locator(byAriaRowIndex(lastVisibleRow + 1)),
      ).not.toBeInViewport();
      await expect(
        this.#locator.getByRole("row").locator(byAriaRowIndex(lastRenderedRow)),
      ).not.toBeInViewport();
      await expect(
        this.#locator
          .getByRole("row")
          .locator(byAriaRowIndex(lastRenderedRow + 1)),
      ).not.toBeAttached();
    }
  }

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
