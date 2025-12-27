import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { expect } from "@playwright/experimental-ct-react";
import { type Locator } from "@playwright/experimental-ct-core";

const byAriaRowIndex = (ariaRowIndex: number) =>
  `[aria-rowindex="${ariaRowIndex}"]:scope`;

export class TableOM {
  #locator: Locator;
  constructor(locator: Locator) {
    this.#locator = locator;
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
}
