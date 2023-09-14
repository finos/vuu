import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import { TestFixtureSimpleOverflowContainer } from "../../../../../../showcase/src/examples/Layout/OverflowContainer.examples";

describe("WHEN it initially renders, with enough space for all items", () => {
  it("THEN all child items will be visible, and none will be marked as wrapped", () => {
    cy.mount(<TestFixtureSimpleOverflowContainer width={700} />);
    const container = cy.findByTestId("overflow-container");
    container.should("have.class", "vuuOverflowContainer");
    container.should("not.have.class", "overflowed");
    // cy.get(".saltTabstrip-inner > *")
    //   .should("have.length", 5)
    //   .filter(":visible")
    //   .should("have.length", 5);
  });
  //   it("THEN no items will be overflowed", () => {
  //     cy.mount(<DefaultTabstrip width={400} />);
  //     cy.get(OVERFLOWED_ITEMS).should("have.length", 0);
  //   });
  //   it("THEN no overflow indicator will be present", () => {
  //     cy.mount(<DefaultTabstrip width={400} />);
  //     cy.get(OVERFLOW_IND).should("have.length", 0);
  //   });
});
