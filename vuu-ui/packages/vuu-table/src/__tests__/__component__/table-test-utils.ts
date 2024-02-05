import { VuuRange } from "packages/vuu-protocol-types";

export const withAriaIndex = (index: number) => ({
  name: (_: string, el: Element) => el.ariaRowIndex === `${index}`,
});

export const assertRenderedColumns = ({
  rendered,
  visible,
}: {
  rendered: VuuRange;
  visible: VuuRange;
}) => {
  const { from, to } = rendered;
  const renderedColumnCount = to - from + 1;
  cy.findByRole("row", withAriaIndex(1))
    .findAllByRole("cell")
    .should("have.length", renderedColumnCount);
};

export const assertRenderedRows = (
  { from, to }: VuuRange,
  renderBufferSize: number,
  totalRowCount: number
) => {
  const leadingBufferedRows = from < renderBufferSize ? from : renderBufferSize;
  const offsetFromEnd = totalRowCount - to;
  const trailingBufferedRows =
    offsetFromEnd < renderBufferSize
      ? Math.min(0, offsetFromEnd)
      : renderBufferSize;
  const renderedRowCount =
    to - from + leadingBufferedRows + trailingBufferedRows;

  // Note the Table Headers row is included in count, hence the + 1
  cy.findAllByRole("row").should("have.length", renderedRowCount + 1);

  // we use the aria index for locators, which is 1 based
  const firstRenderedRow = from - leadingBufferedRows + 1;
  const firstVisibleRow = from + 1;
  const lastVisibleRow = to;
  const lastRenderedRow = to + trailingBufferedRows;

  cy.findByRole("row", withAriaIndex(firstRenderedRow - 1)).should("not.exist");
  cy.findByRole("row", withAriaIndex(firstVisibleRow)).should("be.visible");
  cy.findByRole("row", withAriaIndex(lastVisibleRow)).should("be.visible");

  if (trailingBufferedRows > 0) {
    cy.findByRole("row", withAriaIndex(lastVisibleRow + 1)).should(
      "not.be.visible"
    );
    cy.findByRole("row", withAriaIndex(lastRenderedRow)).should(
      "not.be.visible"
    );
  }
  cy.findByRole("row", withAriaIndex(lastRenderedRow + 1)).should("not.exist");
};
