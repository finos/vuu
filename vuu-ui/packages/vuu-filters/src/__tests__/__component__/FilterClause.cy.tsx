import {
  NewFilterClause,
  PartialFilterClauseColumnAndOperator,
} from "../../../../../showcase/src/examples/Filters/FilterClause/FilterClause.examples";

describe("FilterClause", () => {
  describe("WHEN new filter clause is rendered", () => {
    it("THEN expected classname is present", () => {
      cy.mount(<NewFilterClause />);
      const container = cy.findByTestId("filterclause");
      container.should("have.class", "vuuFilterClause");
    });

    it("THEN component is rendered with column input, is focused and shows suggestions", () => {
      cy.mount(<NewFilterClause />);
      const container = cy.findByTestId("filterclause");
      container.find(".vuuFilterClauseField").should("have.length", 1);
      container.find("input").should("be.focused");
      cy.findAllByRole("option", { name: "currency" }).should("be.visible");
    });
  });

  describe("WHEN partial filter clause with Column and Operator is rendered", () => {
    it("THEN component is rendered with controls for column, operator and value", () => {
      cy.mount(<PartialFilterClauseColumnAndOperator />);
      const container = cy.findByTestId("filterclause");
      container.find(".vuuFilterClauseField").should("have.length", 3);
      cy.findByTestId("filterclause")
        .find(".vuuFilterClauseValue input")
        .should("be.focused");
      cy.findAllByRole("option", { name: "GBP" }).should("be.visible");
    });
  });
});
