import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import { TestTable } from "../../../../../showcase/src/examples/Table/Table.examples";

const withAriaIndex = (index: number) => ({
  name: (_: string, el: HTMLElement) => el.ariaRowIndex === `${index}`,
});

describe("WHEN it initially renders", () => {
  it("THEN expected number of rows are present, with buffered rows, all with correct aria index", () => {
    cy.mount(
      <TestTable
        data-testid="table"
        renderBufferSize={5}
        headerHeight={25}
        height={625}
        rowHeight={20}
        width={1000}
      />
    );

    // Note the Table Headers row is included in count
    const container = cy.findAllByRole("row").should("have.length", 36);
    cy.findByRole("row", withAriaIndex(0)).should("not.exist");
    cy.findByRole("row", withAriaIndex(1)).should("be.visible");
    cy.findByRole("row", withAriaIndex(30)).should("be.visible");
    cy.findByRole("row", withAriaIndex(31)).should("not.be.visible");
    cy.findByRole("row", withAriaIndex(35)).should("not.be.visible");
    cy.findByRole("row", withAriaIndex(36)).should("not.exist");
  });
});
