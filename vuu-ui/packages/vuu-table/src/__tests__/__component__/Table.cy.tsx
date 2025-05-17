import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import { SimulTable } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import { TestTable } from "../../../../../showcase/src/examples/Table/Misc.examples";
import { assertRenderedRows } from "./table-test-utils";

const withAriaIndex = (index: number) => ({
  name: (_: string, el: Element) => el.ariaRowIndex === `${index}`,
});

describe("WHEN it initially renders", () => {
  const RENDER_BUFFER = 5;
  const ROW_COUNT = 1000;
  const tableConfig = {
    renderBufferSize: RENDER_BUFFER,
    headerHeight: 25,
    height: 625,
    rowCount: ROW_COUNT,
    rowHeight: 20,
    width: 1000,
  };

  it("THEN expected classname is present", () => {
    cy.mount(
      <SimulTable
        data-testid="table"
        renderBufferSize={5}
        height={625}
        tableName="instruments"
        width={800}
      />,
    );
    const container = cy.findByTestId("table");
    container.should("have.class", "vuuTable");
  });

  it("THEN expected number of rows are present, with buffered rows, all with correct aria index", () => {
    cy.mount(<TestTable {...tableConfig} />);
    assertRenderedRows({ from: 1, to: 30 }, RENDER_BUFFER, ROW_COUNT);
  });
});
