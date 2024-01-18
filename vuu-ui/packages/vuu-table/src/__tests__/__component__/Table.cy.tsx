import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import { Instruments } from "../../../../../showcase/src/examples/Table/SIMUL.examples";

describe("WHEN it initially renders", () => {
  it("THEN expected classname is present", () => {
    cy.mount(
      <Instruments
        data-testid="table"
        renderBufferSize={5}
        height={625}
        width={800}
      />
    );
    const container = cy.findByTestId("table");
    container.should("have.class", "vuuTable");
  });
});
