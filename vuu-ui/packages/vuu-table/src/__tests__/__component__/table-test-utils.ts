import { VuuRange } from "packages/vuu-protocol-types";

export const withAriaRowIndex = (index: number) => ({
  name: (_: string, el: Element) => el.ariaRowIndex === `${index}`,
});

export const withAriaColIndex = (index: number) => ({
  name: (_: string, el: Element) => el.ariaColIndex === `${index}`,
});

export const assertRenderedColumns = ({
  rendered,
  visible,
}: {
  rendered: VuuRange;
  visible: VuuRange;
}) => {
  const { from: firstRendered, to: lastRendered } = rendered;
  const renderedColumnCount = lastRendered - firstRendered + 1;
  cy.findByRole("row", withAriaRowIndex(1))
    .findAllByRole("cell")
    .should("have.length", renderedColumnCount);

  const { from: firstVisible, to: lastVisible } = visible;

  cy.findByRole("row", withAriaRowIndex(1))
    .findByRole("cell", withAriaColIndex(firstVisible))
    .should("be.visible");
  cy.findByRole("row", withAriaRowIndex(1))
    .findByRole("cell", withAriaColIndex(lastVisible))
    .should("be.visible");

  if (lastRendered > lastVisible) {
    cy.findByRole("row", withAriaRowIndex(1))
      .findByRole("cell", withAriaColIndex(lastVisible + 1))
      .should("not.be.visible");
  }
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

  cy.findByRole("row", withAriaRowIndex(firstRenderedRow - 1)).should(
    "not.exist"
  );
  cy.findByRole("row", withAriaRowIndex(firstVisibleRow)).should("be.visible");
  cy.findByRole("row", withAriaRowIndex(lastVisibleRow)).should("be.visible");

  if (trailingBufferedRows > 0) {
    cy.findByRole("row", withAriaRowIndex(lastVisibleRow + 1)).should(
      "not.be.visible"
    );
    cy.findByRole("row", withAriaRowIndex(lastRenderedRow)).should(
      "not.be.visible"
    );
  }
  cy.findByRole("row", withAriaRowIndex(lastRenderedRow + 1)).should(
    "not.exist"
  );
};
