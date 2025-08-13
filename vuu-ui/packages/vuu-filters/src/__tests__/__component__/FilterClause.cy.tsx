import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  NewFilterClause,
  PartialFilterClauseColumnAndOperator,
  PartialFilterClauseColumnAndOperatorWithDataSource,
  FilterColumnAndOperatorWithDropdownOpenOnFocusDisabled,
  FilterColumnWithDropdownOpenOnFocusDisabled,
  NewFilterClauseWithDropdownOpenOnFocusDisabled,
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

  describe("WHEN partial filter clause with Column and Operator is rendered and dataSource is available", () => {
    it("THEN component is rendered with controls for column, operator and value, value suggestions are offered", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <PartialFilterClauseColumnAndOperator />{" "}
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

  describe("WHEN filter clause is rendered with openDropdownOnFocus disabled", () => {
    describe("WITH new filter clause", () => {
      it("THEN component is rendered with controls for column, no suggestions provided for column control", () => {
        cy.mount(
          <LocalDataSourceProvider>
            <NewFilterClauseWithDropdownOpenOnFocusDisabled />
          </LocalDataSourceProvider>,
        );
        const container = cy.findByTestId("filterclause");
        container.find(".vuuFilterClauseField").should("have.length", 1);
        cy.findByTestId("filterclause")
          .find(".vuuFilterClauseColumn input")
          .should("be.focused");
        cy.findAllByRole("listbox").should("not.exist");
      });
    });
    describe("WITH Column control set", () => {
      it("THEN component is rendered with controls for column, operator, no suggestions provided for operator control", () => {
        cy.mount(
          <LocalDataSourceProvider>
            <FilterColumnWithDropdownOpenOnFocusDisabled />
          </LocalDataSourceProvider>,
        );
        const container = cy.findByTestId("filterclause");
        container.find(".vuuFilterClauseField").should("have.length", 2);
        cy.findByTestId("filterclause")
          .find(".vuuFilterClauseOperator input")
          .should("be.focused");
        cy.findAllByRole("listbox").should("not.exist");
      });
    });
    describe("WITH Column and Operator controls set", () => {
      it("THEN component is rendered with controls for column, operator and value, no suggestions provided for value control", () => {
        cy.mount(
          <LocalDataSourceProvider>
            <FilterColumnAndOperatorWithDropdownOpenOnFocusDisabled />
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
});
