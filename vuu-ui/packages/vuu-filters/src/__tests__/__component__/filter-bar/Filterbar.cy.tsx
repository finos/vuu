// TODO try and get TS path alias working to avoid relative paths like this
import { defaultPatternsByType, formatDate } from "@finos/vuu-utils";
import {
  DefaultFilterBar,
  FilterBarMultipleFilters,
} from "../../../../../../showcase/src/examples/Filters/FilterBar/FilterBar.examples";

// Common selectors
const OVERFLOW_CONTAINER = ".vuuOverflowContainer-wrapContainer";
const OVERFLOW_INDICATOR = ".vuuOverflowContainer-OverflowIndicator";
const ADD_BUTTON = ".vuuFilterBar-add";
const FILTER_CLAUSE = ".vuuFilterClause";
const FILTER_CLAUSE_FIELD = ".vuuFilterClauseField";

const findOverflowItem = (className: string) =>
  cy.get(OVERFLOW_CONTAINER).find(className);

const clickListItem = (label: string) => {
  cy.findByText(label).realHover();
  cy.findByText(label).realClick();
};

const clickListItems = (...labels: string[]) => {
  for (const label of labels) {
    clickListItem(label);
  }
};

const clickButton = (label: string) => {
  cy.findByText(label).should("be.visible");
  cy.findByText(label).realClick();
};

const waitUntilEditableLabelIsFocused = (overflowItemClassName: string) =>
  findOverflowItem(overflowItemClassName)
    .find(".vuuEditableLabel")
    .find("input")
    .should("be.focused");

const assertInputValue = (className: string, value: string) =>
  cy.get(`${className} input`).should("have.attr", "value", value);

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
  it("AND WHEN filterState passed THEN it calls onApplyFilter with currently active filters", () => {
    const onApplyFilter = cy.stub().as("onApplyFilter");
    const filter = { column: "currency", op: "!=", value: "CAD" } as const;
    cy.mount(
      <DefaultFilterBar
        onApplyFilter={onApplyFilter}
        filterState={{
          filters: [filter, { ...filter, value: "USD" }],
          activeIndices: [1],
        }}
      />
    );

    cy.get("@onApplyFilter").should("be.calledWithExactly", {
      filter: 'currency != "USD"',
      filterStruct: { ...filter, value: "USD" },
    });
  });
});

describe("The mouse user", () => {
  describe("WHEN user click Add button on empty Filterbar", () => {
    it("THEN new FilterClause is initiated", () => {
      cy.mount(<DefaultFilterBar />);
      cy.get(ADD_BUTTON).realClick();
      cy.get(OVERFLOW_CONTAINER).find("> *").should("have.length", 3);
      cy.get(OVERFLOW_CONTAINER)
        .find('[data-index="0"] > *')
        .should("have.class", "vuuFilterBar-Editor");

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
      clickListItem("currency");
      cy.get(FILTER_CLAUSE).should("have.length", 1);
      cy.get(FILTER_CLAUSE_FIELD).should("have.length", 2);

      assertInputValue(".vuuFilterClauseColumn", "currency");

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
      clickListItems("currency", "=");

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
      clickListItems("currency", "=", "USD");
      cy.get(FILTER_CLAUSE).should("have.length", 1);
      cy.get(`${FILTER_CLAUSE} ${FILTER_CLAUSE}-clearButton`).should(
        "have.length",
        1
      );
      cy.get(".vuuFilterBuilderMenuList").should("be.visible");
    });
  });

  describe("WHEN user clicks APPLY AND SAVE", () => {
    const testFilter = {
      column: "currency",
      op: "!=",
      value: "USD",
    };

    beforeEach(() => {
      const onFilterStateChanged = cy.stub().as("filterStateChangeHandler");
      const onApplyFilter = cy.stub().as("applyFilterHandler");
      cy.mount(
        <DefaultFilterBar
          onApplyFilter={onApplyFilter}
          onFilterStateChanged={onFilterStateChanged}
        />
      );
      cy.get(ADD_BUTTON).realClick();
      clickListItems(testFilter.column, testFilter.op, testFilter.value);
      clickButton("APPLY AND SAVE");
    });

    it("THEN filterStateChangeHandler callback is invoked", () => {
      cy.get("@filterStateChangeHandler").should("be.calledWith", {
        filters: [testFilter],
        activeIndices: [0],
      });
    });

    it("THEN filter is applied", () => {
      cy.get("@applyFilterHandler").should("be.calledWith", {
        filter: 'currency != "USD"',
        filterStruct: testFilter,
      });
    });

    it("THEN filter pill is displayed, label is in edit state and focused", () => {
      cy.get(OVERFLOW_CONTAINER).find("> *").should("have.length", 2);
      findOverflowItem(".vuuFilterPill").should("have.length", 1);
      findOverflowItem(".vuuFilterPill")
        .find(".vuuEditableLabel")
        .should("have.class", "vuuEditableLabel-editing");
      findOverflowItem(".vuuFilterPill")
        .find(".vuuEditableLabel")
        .find("input")
        .should("be.focused");
    });

    describe("WHEN user overtypes label and presses ENTER", () => {
      it("THEN label is applied and exits edit mode", () => {
        waitUntilEditableLabelIsFocused(".vuuFilterPill");
        cy.realType("test");
        cy.realPress("Enter");
        findOverflowItem(".vuuFilterPill")
          .find(".vuuEditableLabel")
          .should("not.have.class", "vuuEditableLabel-editing");
        cy.get("@filterStateChangeHandler").should("be.calledWith", {
          filters: [{ ...testFilter, name: "test" }],
          activeIndices: [0],
        });
      });

      it("THEN filter pill has focus", () => {
        waitUntilEditableLabelIsFocused(".vuuFilterPill");
        cy.realType("test");
        cy.realPress("Enter");
        findOverflowItem(".vuuFilterPill").should("be.focused");
      });
    });

    describe("AND WHEN user edits the saved filter", () => {
      it("THEN onFiltersChanged & onApplyFilter is called with new filter", () => {
        const filterName = "EditedFilter";
        const newFilter = { ...testFilter, value: "CAD", name: filterName };

        waitUntilEditableLabelIsFocused(".vuuFilterPill");
        cy.realType(filterName);
        cy.realPress("Enter");

        // Edit an existing filter
        findOverflowItem(".vuuFilterPill")
          .find(".vuuFilterPillMenu")
          .realClick();
        clickButton("Edit");
        clickListItems(newFilter.column, newFilter.op, newFilter.value);
        clickButton("APPLY AND SAVE");

        cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
          filters: [newFilter],
          activeIndices: [0],
        });
        cy.get("@applyFilterHandler").should("be.calledWithExactly", {
          filter: 'currency != "CAD"',
          filterStruct: newFilter,
        });
      });
    });
  });

  describe("WHEN adds two filters", () => {
    const filter1 = {
      column: "currency",
      op: "!=",
      value: "USD",
      name: 'currency != "USD"',
    };
    const filter2 = {
      column: "currency",
      op: "!=",
      value: "CAD",
      name: 'currency != "CAD"',
    };

    beforeEach(() => {
      const onFilterStateChanged = cy.stub().as("filterStateChangeHandler");
      const onApplyFilter = cy.stub().as("applyFilterHandler");
      cy.mount(
        <DefaultFilterBar
          onApplyFilter={onApplyFilter}
          onFilterStateChanged={onFilterStateChanged}
        />
      );
      cy.get(ADD_BUTTON).realClick();
      clickListItems(filter1.column, filter1.op, filter1.value);
      clickButton("APPLY AND SAVE");
      waitUntilEditableLabelIsFocused(".vuuFilterPill");
      cy.realPress("Enter");

      cy.get(ADD_BUTTON).realClick();
      clickListItems(filter2.column, filter2.op, filter2.value);
      clickButton("APPLY AND SAVE");
      waitUntilEditableLabelIsFocused(".vuuFilterPill");
      cy.realPress("Enter");
    });

    it("THEN filterStateChangeHandler & applyFilterHandler callbacks are invoked with correct values", () => {
      cy.get("@filterStateChangeHandler").should("be.calledWith", {
        filters: [filter1, filter2],
        activeIndices: [0, 1],
      });

      cy.get("@applyFilterHandler").should("be.calledWith", {
        filter: 'currency != "USD" and currency != "CAD"',
        filterStruct: { op: "and", filters: [filter1, filter2] },
      });
    });

    it("AND WHEN one filter is made inactive THEN changes are correctly applied", () => {
      findOverflowItem('[data-index="0"]').realClick({ shiftKey: true });
      findOverflowItem('[data-index="0"]').find("[aria-selected='false']");
      findOverflowItem('[data-index="1"]').find("[aria-selected='true']");

      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [filter1, filter2],
        activeIndices: [1],
      });

      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: 'currency != "CAD"',
        filterStruct: filter2,
      });
    });

    it("AND WHEN second filter is deleted THEN changes are correctly applied", () => {
      findOverflowItem('[data-index="1"]')
        .find(".vuuFilterPillMenu")
        .realClick();
      clickButton("Delete");
      clickButton("Remove");

      findOverflowItem(".vuuFilterPill").should("have.length", 1);
      findOverflowItem(".vuuFilterPill").contains(filter1.name);

      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [filter1],
        activeIndices: [0],
      });
      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: filter1.name,
        filterStruct: filter1,
      });
    });

    it("AND WHEN first filter is deleted THEN changes are correctly applied", () => {
      findOverflowItem('[data-index="0"]')
        .find(".vuuFilterPillMenu")
        .realClick();
      clickButton("Delete");
      clickButton("Remove");

      findOverflowItem(".vuuFilterPill").should("have.length", 1);
      findOverflowItem(".vuuFilterPill").contains(filter2.name);

      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [filter2],
        activeIndices: [0],
      });
      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: filter2.name,
        filterStruct: filter2,
      });
    });
  });
});

describe("The keyboard user", () => {
  describe("WHEN user navigates with keyboard to empty Filterbar", () => {
    it("THEN add button is focussed", () => {
      cy.mount(<DefaultFilterBar />);
      cy.findByTestId("pre-filterbar").find("input").focus();
      cy.realPress("Tab");
      cy.get(ADD_BUTTON).should("be.focused");
    });

    describe("WHEN user presses ADD then uses keyboard to select currency", () => {
      it("THEN currency is selected and focus moves to operator", () => {
        cy.mount(<DefaultFilterBar />);

        cy.findByTestId("pre-filterbar").find("input").focus();
        cy.realPress("Tab");
        cy.get(ADD_BUTTON).should("be.focused");
        cy.realPress("Enter");
        cy.findByRole("combobox").should("be.focused");

        // make sure columns list has renderered
        cy.findByText("currency").should("exist");
        cy.realPress("ArrowDown");
        cy.get(".vuuListItem.vuuHighlighted").should("have.text", "currency");
        cy.realPress("Enter");

        assertInputValue(".vuuFilterClauseColumn", "currency");

        cy.get(".vuuFilterClauseOperator input").should("be.focused");
        cy.get(".vuuFilterClauseOperator input").should(
          "have.attr",
          "aria-expanded",
          "true"
        );
      });
    });
    describe("THEN WHEN user uses keyboard to select =", () => {
      it("THEN = is selected and focus moves to value", () => {
        cy.mount(<DefaultFilterBar />);

        cy.findByTestId("pre-filterbar").find("input").focus();
        cy.realPress("Tab");
        cy.get(ADD_BUTTON).should("be.focused");
        cy.realPress("Enter");
        cy.findByRole("combobox").should("be.focused");

        // make sure columns list has renderered
        cy.findByText("currency").should("exist");
        cy.realPress("ArrowDown");
        cy.get(".vuuListItem.vuuHighlighted").should("have.text", "currency");
        cy.realPress("Enter");

        cy.findByText("=").should("exist");
        cy.get(".vuuListItem.vuuHighlighted").should("have.text", "=");
        cy.realPress("Enter");

        assertInputValue(".vuuFilterClauseOperator", "=");

        cy.get(".vuuFilterClauseValue input").should("be.focused");
        cy.get(".vuuFilterClauseValue input").should(
          "have.attr",
          "aria-expanded",
          "true"
        );
      });
      describe("THEN WHEN user uses keyboard to select USD", () => {
        it("THEN USD is selected,  and focus moves to Menu", () => {
          cy.mount(<DefaultFilterBar />);

          cy.findByTestId("pre-filterbar").find("input").focus();
          cy.realPress("Tab");
          cy.get(ADD_BUTTON).should("be.focused");
          cy.realPress("Enter");
          cy.findByRole("combobox").should("be.focused");

          // make sure columns list has renderered
          cy.findByText("currency").should("exist");
          cy.realPress("ArrowDown");
          cy.realPress("Enter");

          cy.findByText("=").should("exist");
          cy.realPress("Enter");

          cy.findByText("USD").should("exist");
          cy.realPress("ArrowDown");
          cy.realPress("ArrowDown");
          cy.realPress("ArrowDown");
          cy.realPress("ArrowDown");
          cy.realPress("Enter");

          assertInputValue(".vuuFilterClauseValue", "USD");

          cy.get(FILTER_CLAUSE).should("have.length", 1);
          cy.get(`${FILTER_CLAUSE} ${FILTER_CLAUSE}-clearButton`).should(
            "have.length",
            1
          );
          cy.get(".vuuFilterBuilderMenuList")
            .should("be.visible")
            .should("be.focused");
        });
      });
    });
  });
});

const getDate = (t: "start-today" | "start-tomorrow" | "end-today") => {
  const today = new Date();
  switch (t) {
    case "start-today":
      today.setHours(0, 0, 0, 0);
      return today;
    case "start-tomorrow":
      return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );
    case "end-today":
      today.setHours(23, 59, 59, 999);
      return today;
  }
};

describe("WHEN a user applies a date filter", () => {
  const DATE_COLUMN = "lastUpdated";
  const todayDateFormatted = formatDate({ date: defaultPatternsByType.date })(
    new Date()
  );
  const startOfToday = getDate("start-today").getTime();
  const endOfToday = getDate("end-today").getTime();
  const startOfTomorrow = getDate("start-tomorrow").getTime();

  beforeEach(() => {
    const onApplyFilter = cy.stub().as("applyFilterHandler");
    const onFilterStateChanged = cy.stub().as("filterStateChangeHandler");
    cy.mount(
      <DefaultFilterBar
        onApplyFilter={onApplyFilter}
        onFilterStateChanged={onFilterStateChanged}
      />
    );
  });

  const testParams: Array<{
    op: string;
    expectedValue: number;
    expectedQuery: string;
  }> = [
    {
      op: "=",
      expectedValue: startOfToday,
      expectedQuery: `${DATE_COLUMN} >= ${startOfToday} and ${DATE_COLUMN} < ${startOfTomorrow}`,
    },
    {
      op: "!=",
      expectedValue: startOfToday,
      expectedQuery: `${DATE_COLUMN} < ${startOfToday} or ${DATE_COLUMN} >= ${startOfTomorrow}`,
    },
    {
      op: ">",
      expectedValue: endOfToday,
      expectedQuery: `${DATE_COLUMN} > ${endOfToday}`,
    },
    {
      op: ">=",
      expectedValue: startOfToday,
      expectedQuery: `${DATE_COLUMN} >= ${startOfToday}`,
    },
    {
      op: "<",
      expectedValue: startOfToday,
      expectedQuery: `${DATE_COLUMN} < ${startOfToday}`,
    },
    {
      op: "<=",
      expectedValue: endOfToday,
      expectedQuery: `${DATE_COLUMN} <= ${endOfToday}`,
    },
  ];

  testParams.forEach(({ op, expectedValue, expectedQuery }) =>
    it(`AND uses ${op} THEN resulting filter query can be understood by the VUU
     server while the filter on the ui appears as selected by the user`, () => {
      const expectedFilter = {
        column: DATE_COLUMN,
        op,
        value: expectedValue,
        name: `${DATE_COLUMN} ${op} "${todayDateFormatted}"`,
      };

      // Add date filter
      cy.get(ADD_BUTTON).realClick();
      clickListItems(DATE_COLUMN, op);
      findOverflowItem(".vuuDatePicker-calendarIconButton").realClick();
      cy.get(".saltCalendarDay-today:not(.saltCalendarDay-hidden)").realClick();
      cy.realPress("ArrowRight");
      clickButton("APPLY AND SAVE");
      waitUntilEditableLabelIsFocused(".vuuFilterPill");
      cy.realPress("Enter");

      // Check called handlers
      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: expectedQuery,
        filterStruct: expectedFilter,
      });
      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [expectedFilter],
        activeIndices: [0],
      });
    })
  );
});

describe("Deleting and renaming filters", () => {
  describe("WHEN user deletes a filter", () => {
    it("THEN onFilterDeleted callback is called", () => {
      const onFilterDeleted = cy.stub().as("onFilterDeleted");
      cy.mount(<FilterBarMultipleFilters onFilterDeleted={onFilterDeleted} />);

      findOverflowItem('[data-index="0"]').findByRole("button").realClick();
      clickButton("Delete");
      clickButton("Remove");

      cy.get("@onFilterDeleted").should("be.calledWithExactly", {
        column: "currency",
        name: "Filter One",
        op: "=",
        value: "EUR",
      });
    });
  });

  describe("WHEN user renames a filter", () => {
    it("THEN onFilterRenamed callback is called", () => {
      const onFilterRenamed = cy.stub().as("onFilterRenamed");
      cy.mount(<FilterBarMultipleFilters onFilterRenamed={onFilterRenamed} />);

      findOverflowItem('[data-index="0"]').findByText("Filter One").dblclick();
      cy.realType("Test");
      cy.realPress("Enter");

      cy.get("@onFilterRenamed").should(
        "be.calledWithExactly",
        {
          column: "currency",
          name: "Filter One",
          op: "=",
          value: "EUR",
        },
        "Test"
      );
    });
  });
});
