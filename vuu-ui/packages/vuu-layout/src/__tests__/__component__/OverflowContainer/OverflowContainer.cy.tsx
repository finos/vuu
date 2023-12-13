import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import { TestFixtureSimpleOverflowContainer } from "../../../../../../showcase/src/examples/Layout/OverflowContainer.examples";

describe("WHEN it initially renders, with enough space for all items", () => {
  it("THEN all child items will be visible, and none will be marked as wrapped", () => {
    cy.mount(<TestFixtureSimpleOverflowContainer width={700} />);
    const container = cy.findByTestId("overflow-container");
    container.should("have.class", "vuuOverflowContainer");
    container.should(
      "not.have.class",
      "vuuOverflowContainer-wrapContainer-overflowed"
    );
  });
});

describe("WHEN it initially renders, with space for all but one items", () => {
  it("THEN all but one items will be visible, one will be marked as wrapped and overflow Indicator will be visible", () => {
    cy.mount(<TestFixtureSimpleOverflowContainer width={600} />);
    const container = cy.findByTestId("overflow-container");
    const wrapContainer = container.children().first();
    wrapContainer.should(
      "have.class",
      "vuuOverflowContainer-wrapContainer-overflowed"
    );
  });
});
