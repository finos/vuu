import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  NewFilterClause,
  PartialFilterClauseColumnAndOperator,
  PartialFilterClauseColumnAndOperatorWithDataSource,
  PartialFilterClauseColumnAndOperatorWithoutDefaultDropdown,
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

  describe.skip("WHEN partial filter clause with Column and Operator is rendered, but no dataSource available", () => {
    it("THEN component is rendered with controls for column, operator and value, no suggestions provided", () => {
      cy.mount(<PartialFilterClauseColumnAndOperator />);
      const container = cy.findByTestId("filterclause");
      container.find(".vuuFilterClauseField").should("have.length", 3);
      cy.findByTestId("filterclause")
        .find(".vuuFilterClauseValue input")
        .should("be.focused");
      cy.findAllByRole("listbox").should("not.exist");
    });
  });

  describe("WHEN partial filter clause with Column and Operator is rendered and dataSOurce is available", () => {
    it("THEN component is rendered with controls for column, operator and value, value suggestions are offered", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <PartialFilterClauseColumnAndOperatorWithDataSource />
        </LocalDataSourceProvider>,
      );
      const container = cy.findByTestId("filterclause");
      container.find(".vuuFilterClauseField").should("have.length", 3);
      cy.findByTestId("filterclause")
        .find(".vuuFilterClauseValue input")
        .should("be.focused");
      cy.findAllByRole("option", { name: "GBP" }).should("be.visible");
    });
  });

  describe("WHEN partial filter clause with Column and Operator is rendered and default dropdown is disabled for value editor", () => {
    it("THEN component is rendered with controls for column, operator and value, no suggestions provided", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <PartialFilterClauseColumnAndOperatorWithoutDefaultDropdown />
        </LocalDataSourceProvider>,
      );
      const container = cy.findByTestId("filterclause");
      container.find(".vuuFilterClauseField").should("have.length", 3);
      cy.findByTestId("filterclause")
        .find(".vuuFilterClauseValue input")
        .should("be.focused");
      cy.findAllByRole("listbox").should("not.exist");
    });
  });
});
