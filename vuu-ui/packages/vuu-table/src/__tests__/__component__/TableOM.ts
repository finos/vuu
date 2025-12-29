import { expect } from "@playwright/experimental-ct-react";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { type Locator } from "@playwright/experimental-ct-core";

type AriaRole = "cell" | "textbox";

const byAriaRowIndex = (ariaRowIndex: number) =>
  `[aria-rowindex="${ariaRowIndex}"]:scope`;

export class TableOM {
  #locator: Locator;
  constructor(locator: Locator) {
    this.#locator = locator;
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

  locateCell(text: string): Locator;
  locateCell(row: number, column: number): Locator;
  locateCell(rowOrText: number | string, column?: number) {
    if (typeof rowOrText === "number" && typeof column === "number") {
      return this.#locator.locator(
        `[aria-rowindex="${rowOrText}"] > [aria-colindex="${column}"]`,
      );
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
    let target: Locator | undefined = undefined;
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
      throw Error("TableOM, assertCellIsFocused, invalid parameters");
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
    let target: Locator | undefined = undefined;
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
      if (editing) {
        return expect(target).toContainClass("vuuEditing");
      } else {
        return expect(target).not.toContainClass("vuuEditing");
      }
    } else {
      throw Error("TableOM, assertCellIsEditing, invalid parameters");
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
    const firstVisibleRow = from + headerCount;
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
