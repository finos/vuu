import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import { DefaultFilterBar } from "../../../../../../showcase/src/examples/Filters/FilterBar/FilterBar.examples";

// Common selectors
const OVERFLOW_CONTAINER = ".vuuOverflowContainer-wrapContainer";
const OVERFLOW_INDICATOR = ".vuuOverflowContainer-OverflowIndicator";
const ADD_BUTTON = ".vuuFilterBar-add";
const FILTER_CLAUSE = ".vuuFilterClause";
const FILTER_CLAUSE_FIELD = ".vuuFilterClauseField";

describe("WHEN it initially renders", () => {
  it("THEN expected classname is present", () => {
    cy.mount(<DefaultFilterBar />);
    const container = cy.findByTestId("filterbar");
    container.should("have.class", "vuuFilterBar");
  });
  it("THEN content container is empty, except for non-visible overflow indicator", () => {
    cy.mount(<DefaultFilterBar />);
    const container = cy.findByTestId("filterbar");
    container.get(OVERFLOW_CONTAINER).find("> *").should("have.length", 1);
    container.get(OVERFLOW_INDICATOR).should("exist");
    container.get(OVERFLOW_INDICATOR).should("have.css", "width", "0px");
  });
});

describe("The mouse users experience", () => {
  describe("WHEN user click Add button on empty Filterbar", () => {
    it("THEN new FilterClause is initiated", () => {
      cy.mount(<DefaultFilterBar />);
      cy.get(ADD_BUTTON).realClick();
      cy.get(OVERFLOW_CONTAINER).find("> *").should("have.length", 3);
      cy.get(OVERFLOW_CONTAINER)
        .find('[data-index="0"] > *')
        .should("have.class", "vuuFilterClause");

      cy.get(OVERFLOW_CONTAINER)
        .find('[data-index="1"] > *')
        .should("have.class", "vuuFilterBar-remove");

      cy.get(OVERFLOW_INDICATOR).should("exist");
      cy.get(OVERFLOW_INDICATOR).should("have.css", "width", "0px");
    });

    it("THEN column combobox is focused and the dropdown shown", () => {
      cy.mount(<DefaultFilterBar />);
      cy.get(ADD_BUTTON).realClick();
      cy.findByRole("combobox").should("be.focused");
      cy.findByRole("combobox").should("have.attr", "aria-expanded", "true");

      // make sure columns list has renderered
      cy.findByText("currency").should("exist");
    });
  });

  describe("WHEN user selects a column", () => {
    it("THEN focus moves to operator field", () => {
      cy.mount(<DefaultFilterBar />);
      cy.get(ADD_BUTTON).realClick();
      cy.findByText("currency").realHover();
      cy.findByText("currency").realClick();
      cy.get(FILTER_CLAUSE).should("have.length", 1);
      cy.get(FILTER_CLAUSE_FIELD).should("have.length", 2);

      cy.get(".vuuFilterClauseColumn input").should(
        "have.attr",
        "value",
        "currency"
      );

      cy.get(".vuuFilterClauseOperator input").should("be.focused");
      cy.get(".vuuFilterClauseOperator input").should(
        "have.attr",
        "aria-expanded",
        "true"
      );

      // make sure operators list has renderered
      cy.findByText("=").should("exist");
    });
  });
  describe("WHEN user selects an operator", () => {
    it("THEN focus moves to value field", () => {
      cy.mount(<DefaultFilterBar />);
      cy.get(ADD_BUTTON).realClick();
      cy.findByText("currency").realHover();
      cy.findByText("currency").realClick();
      cy.findByText("=").realHover();
      cy.findByText("=").realClick();

      cy.get(FILTER_CLAUSE).should("have.length", 1);
      cy.get(FILTER_CLAUSE_FIELD).should("have.length", 3);

      cy.get(".vuuFilterClauseValue input").should("be.focused");
      cy.get(".vuuFilterClauseValue input").should(
        "have.attr",
        "aria-expanded",
        "true"
      );
      cy.findByText("USD").should("exist");
    });
  });

  describe("WHEN user selects a value", () => {
    it("THEN Save menu is shown", () => {
      cy.mount(<DefaultFilterBar />);
      cy.get(ADD_BUTTON).realClick();
      cy.findByText("currency").realHover();
      cy.findByText("currency").realClick();
      cy.findByText("=").realHover();
      cy.findByText("=").realClick();
      cy.findByText("USD").realHover();
      cy.findByText("USD").realClick();

      cy.get(FILTER_CLAUSE).should("have.length", 1);
      cy.get(`${FILTER_CLAUSE} ${FILTER_CLAUSE}-clearButton`).should(
        "have.length",
        1
      );
      cy.get(".vuuFilterBuilderMenuList").should("be.visible");
    });
  });

  describe("WHEN user clicks APPLY AND SAVE", () => {
    it("THEN filter is saved", () => {
      const onFiltersChanged = cy.stub().as("filtersChangedHandler");
      cy.mount(<DefaultFilterBar onFiltersChanged={onFiltersChanged} />);
      cy.get(ADD_BUTTON).realClick();
      cy.findByText("currency").realHover();
      cy.findByText("currency").realClick();
      cy.findByText("=").realHover();
      cy.findByText("=").realClick();
      cy.findByText("USD").realHover();
      cy.findByText("USD").realClick();
      cy.findByText("APPLY AND SAVE").should("be.visible");
      cy.findByText("APPLY AND SAVE").realClick();
      cy.get("@filtersChangedHandler").should("have.been.called");
      cy.get("@filtersChangedHandler").should("be.calledWith", [
        { column: "currency", op: "=", value: "USD" },
      ]);
    });
  });
});

// describe("The keyboard users experience", () => {
//   describe("WHEN user click Add button on empty Filterbar", () => {
//     it("THEN new FilterClasue is initiated adn column is focussed", () => {});
//   });
// });
