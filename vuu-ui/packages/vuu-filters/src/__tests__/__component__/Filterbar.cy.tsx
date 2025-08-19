// TODO try and get TS path alias working to avoid relative paths like this
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  DefaultFilterBar,
  FilterBarMultipleFilters,
} from "../../../../../showcase/src/examples/Filters/FilterBar/FilterBar.examples";

// Common selectors
const FILTER_CONTAINER = ".vuuCustomFilters-filters";
const FILTER_CLAUSE = ".vuuFilterClause";
const VISIBLE_MONTH = ".saltCalendarCarousel-slide:not([aria-hidden])";

const findAddButton = () =>
  cy.get(".vuuCustomFilters").findByRole("button", { name: "Add filter" });

const findFilter = (className: string) =>
  cy.get(FILTER_CONTAINER).find(className);

const clickListItem = (name: string) => {
  cy.findByRole("option", { name }).realHover();
  cy.findByRole("option", { name }).realClick();
};

const clickListItems = (...labels: string[]) => {
  for (const label of labels) {
    clickListItem(label);
  }
};

const clickButton = (label: string, skipVisibilityCheck = false) => {
  // We occasionally need to skip visibility check. e.g. cypress fails
  // to take into account the fact that an element in a dialog might be
  // visible even although technically outside the limits of containing
  // box - the dialog renders over and completely outside the contaning box.
  if (!skipVisibilityCheck) {
    cy.findByText(label).should("be.visible");
  }
  cy.findByText(label).realClick();
};

const clickDialogButton = (label: string) => clickButton(label, true);

const waitUntilEditableLabelIsFocused = (index = 0) =>
  findFilter(".vuuFilterPill")
    .eq(index)
    .find(".vuuEditableLabel")
    .find("input")
    .should("be.focused");

const pressEnterEditableLabel = (index = 0) => {
  findFilter(".vuuFilterPill")
    .eq(index)
    .find(".vuuEditableLabel")
    .find("input")
    .trigger("keydown", { key: "Enter" });
};

const assertInputValue = (className: string, value: string) =>
  cy.get(`${className} input`).should("have.attr", "value", value);

describe("WHEN it initially renders", () => {
  it("THEN expected classname is present", () => {
    cy.mount(<DefaultFilterBar />);
    const container = cy.findByTestId("filterbar");
    container.should("have.class", "vuuFilterBar");
  });
  it("THEN filter container is empty", () => {
    cy.mount(<DefaultFilterBar />);
    const container = cy.findByTestId("filterbar");
    container.get(FILTER_CONTAINER).find("> *").should("have.length", 0);
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
      />,
    );

    cy.get("@onApplyFilter").should("be.calledWithExactly", {
      filter: 'currency != "USD"',
      filterStruct: { ...filter, value: "USD" },
    });
  });
});

describe("The mouse user", () => {
  describe("WHEN user click Add button on empty Filterbar", () => {
    it("THEN FilterEditor is shown and new FilterClause is initiated", () => {
      cy.mount(<DefaultFilterBar />);
      findAddButton().realClick();
      cy.get(FILTER_CONTAINER).find("> *").should("have.length", 0);
      cy.get(".vuuFilterEditor").should("be.visible");
    });

    it("THEN column combobox is focused and the dropdown shown", () => {
      cy.mount(<DefaultFilterBar />);
      findAddButton().realClick();
      cy.findByRole("combobox").should("be.focused");
      cy.findByRole("combobox").should("have.attr", "aria-expanded", "true");

      // make sure columns list has renderered
      cy.findByText("currency").should("exist");
    });
  });

  describe("WHEN user clicks SAVE", () => {
    const testFilter = {
      column: "currency",
      op: "=",
      value: "EUR",
    };

    beforeEach(() => {
      const onFilterStateChanged = cy.stub().as("filterStateChangeHandler");
      const onApplyFilter = cy.stub().as("applyFilterHandler");
      cy.mount(
        <DefaultFilterBar
          onApplyFilter={onApplyFilter}
          onFilterStateChanged={onFilterStateChanged}
        />,
      );
      findAddButton().realClick();
      cy.findAllByRole("combobox").eq(0).should("be.focused");
      cy.findByRole("option", { name: "currency" }).realHover();
      cy.findByRole("option", { name: "currency" }).realClick();
      cy.findAllByRole("combobox").eq(1).should("be.focused");
      cy.findByRole("option", { name: "=" }).realHover();
      cy.findByRole("option", { name: "=" }).realClick();
      cy.findAllByRole("combobox").eq(2).should("be.focused");
      cy.findByRole("option", { name: "EUR" }).realHover();
      cy.findByRole("option", { name: "EUR" }).realClick();
      cy.findByRole("button", { name: "Save" }).should("be.focused");

      clickButton("Save");
    });

    it("THEN filterStateChangeHandler callback is invoked", () => {
      cy.get("@filterStateChangeHandler").should("be.calledWith", {
        filters: [testFilter],
        activeIndices: [0],
      });
    });

    it("THEN filter is applied", () => {
      cy.get("@applyFilterHandler").should("be.calledWith", {
        filter: 'currency = "EUR"',
        filterStruct: testFilter,
      });
    });

    it("THEN filter pill is displayed, label is in edit state and focused", () => {
      cy.get(FILTER_CONTAINER).find("> *").should("have.length", 1);
      cy.get(FILTER_CONTAINER).find(".vuuFilterPill").should("have.length", 1);

      cy.get(FILTER_CONTAINER)
        .find(".vuuFilterPill")
        .find(".vuuEditableLabel")
        .should("have.class", "vuuEditableLabel-editing");
      cy.get(FILTER_CONTAINER)
        .find(".vuuFilterPill")
        .find(".vuuEditableLabel")
        .find("input")
        .should("be.focused");
    });

    describe("WHEN user overtypes label and presses ENTER", () => {
      it("THEN label is applied and exits edit mode", () => {
        waitUntilEditableLabelIsFocused();
        cy.realType("test");
        cy.realPress("Enter");
        cy.get(FILTER_CONTAINER)
          .find(".vuuFilterPill")
          .find(".vuuEditableLabel")
          .should("not.have.class", "vuuEditableLabel-editing");
        cy.get("@filterStateChangeHandler").should("be.calledWith", {
          filters: [{ ...testFilter, name: "test" }],
          activeIndices: [0],
        });
      });

      it("THEN filter pill has focus", () => {
        waitUntilEditableLabelIsFocused();
        cy.realType("test");
        cy.realPress("Enter");
        cy.get(FILTER_CONTAINER)
          .find(".vuuFilterPill .vuuSplitButton-main")
          .should("be.focused");
      });
    });

    describe("AND WHEN user edits the saved filter", () => {
      it("THEN onFiltersChanged & onApplyFilter is called with new filter", () => {
        const filterName = "EditedFilter";
        const newFilter = { ...testFilter, value: "CAD", name: filterName };

        waitUntilEditableLabelIsFocused();
        cy.realType(filterName);
        pressEnterEditableLabel();

        // Edit an existing filter
        cy.get(FILTER_CONTAINER)
          .find(".vuuFilterPill")
          .find(".vuuSplitButton-trigger")
          .realClick();
        clickButton("Edit");
        cy.findAllByRole("combobox").eq(0).should("be.focused");
        cy.findByRole("option", { name: "currency" }).realHover();
        cy.findByRole("option", { name: "currency" }).realClick();
        cy.findAllByRole("combobox").eq(1).should("be.focused");
        cy.findByRole("option", { name: "=" }).realHover();
        cy.findByRole("option", { name: "=" }).realClick();
        cy.findAllByRole("combobox").eq(2).should("be.focused");
        cy.findByRole("option", { name: "CAD" }).realHover();
        cy.findByRole("option", { name: "CAD" }).realClick();
        cy.findByRole("button", { name: "Save" }).should("be.focused");
        clickButton("Save");

        cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
          filters: [newFilter],
          activeIndices: [0],
        });
        cy.get("@applyFilterHandler").should("be.calledWithExactly", {
          filter: 'currency = "CAD"',
          filterStruct: newFilter,
        });
      });
    });
  });

  describe("WHEN adds two filters", () => {
    const filter1 = {
      column: "currency",
      op: "=",
      value: "USD",
      name: "currency",
    };
    const filter2 = {
      column: "exchange",
      op: "=",
      value: "MIL/EUR_IT",
      name: "exchange",
    };

    beforeEach(() => {
      const onFilterStateChanged = cy.stub().as("filterStateChangeHandler");
      const onApplyFilter = cy.stub().as("applyFilterHandler");
      cy.mount(
        <DefaultFilterBar
          onApplyFilter={onApplyFilter}
          onFilterStateChanged={onFilterStateChanged}
        />,
      );
      findAddButton().realClick();
      cy.findAllByRole("combobox").eq(0).should("be.focused");
      cy.findByRole("option", { name: filter1.column }).realHover();
      cy.findByRole("option", { name: filter1.column }).realClick();
      cy.findAllByRole("combobox").eq(1).should("be.focused");
      cy.findByRole("option", { name: filter1.op }).realHover();
      cy.findByRole("option", { name: filter1.op }).realClick();
      cy.findAllByRole("combobox").eq(2).should("be.focused");
      cy.findByRole("option", { name: filter1.value }).realHover();
      cy.findByRole("option", { name: filter1.value }).realClick();
      cy.findByRole("button", { name: "Save" }).should("be.focused");
      clickButton("Save");
      waitUntilEditableLabelIsFocused();
      pressEnterEditableLabel();

      findAddButton().realClick();
      cy.findAllByRole("combobox").eq(0).should("be.focused");
      cy.findByRole("option", { name: filter2.column }).realHover();
      cy.findByRole("option", { name: filter2.column }).realClick();
      cy.findAllByRole("combobox").eq(1).should("be.focused");
      cy.findByRole("option", { name: filter2.op }).realHover();
      cy.findByRole("option", { name: filter2.op }).realClick();
      cy.findAllByRole("combobox").eq(2).should("be.focused");
      cy.findByRole("option", { name: filter2.value }).realHover();
      cy.findByRole("option", { name: filter2.value }).realClick();
      cy.findByRole("button", { name: "Save" }).should("be.focused");
      clickButton("Save");
      waitUntilEditableLabelIsFocused(1);
      pressEnterEditableLabel(1);
    });

    it("THEN filterStateChangeHandler & applyFilterHandler callbacks are invoked with correct values", () => {
      cy.get("@filterStateChangeHandler").its("callCount").should("eq", 4);
      cy.get("@filterStateChangeHandler").should("be.calledWith", {
        filters: [filter1, filter2],
        activeIndices: [0, 1],
      });

      cy.get("@applyFilterHandler").should("be.calledWith", {
        filter: 'currency = "USD" and exchange = "MIL/EUR_IT"',
        filterStruct: { op: "and", filters: [filter1, filter2] },
      });
    });

    it("AND WHEN one filter is made inactive THEN changes are correctly applied", () => {
      findFilter('[data-index="0"]').realClick({ shiftKey: true });
      findFilter('[data-index="0"]').should(
        "have.attr",
        "aria-checked",
        "false",
      );
      findFilter('[data-index="1"]').should(
        "have.attr",
        "aria-checked",
        "true",
      );

      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [filter1, filter2],
        activeIndices: [1],
      });

      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: 'exchange = "MIL/EUR_IT"',
        filterStruct: filter2,
      });
    });

    it("AND WHEN second filter is deleted THEN changes are correctly applied", () => {
      findFilter('[data-index="1"]')
        .find(".vuuSplitButton-trigger")
        .realClick();
      clickButton("Delete");
      clickDialogButton("Remove");

      findFilter(".vuuFilterPill").should("have.length", 1);
      findFilter(".vuuFilterPill").contains(filter1.name);

      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [filter1],
        activeIndices: [0],
      });
      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: 'currency = "USD"',
        filterStruct: filter1,
      });
    });

    it("AND WHEN first filter is deleted THEN changes are correctly applied", () => {
      findFilter('[data-index="0"]')
        .find(".vuuSplitButton-trigger")
        .realClick();
      clickButton("Delete");
      clickDialogButton("Remove");

      findFilter(".vuuFilterPill").should("have.length", 1);
      findFilter(".vuuFilterPill").contains(filter2.name);

      cy.get("@filterStateChangeHandler").should("be.calledWithExactly", {
        filters: [filter2],
        activeIndices: [0],
      });
      cy.get("@applyFilterHandler").should("be.calledWithExactly", {
        filter: `exchange = "MIL/EUR_IT"`,
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
      findAddButton().should("be.focused");
    });

    describe("WHEN user presses ADD then uses keyboard to select currency", () => {
      it("THEN currency is selected and focus moves to operator", () => {
        cy.mount(<DefaultFilterBar />);

        cy.findByTestId("pre-filterbar").find("input").focus();
        cy.realPress("Tab");
        findAddButton().should("be.focused");
        cy.realPress("Enter");
        cy.findByRole("combobox").should("be.focused");

        // make sure columns list has renderered
        cy.findByText("currency").should("be.visible");
        cy.realPress("ArrowDown");
        cy.get(".saltOption-active").should("have.text", "currency");
        cy.realPress("Enter");

        assertInputValue(".vuuFilterClauseColumn", "currency");

        cy.get(".vuuFilterClauseOperator input").should("be.focused");
        cy.get(".vuuFilterClauseOperator input").should(
          "have.attr",
          "aria-expanded",
          "true",
        );
      });
    });
    describe("THEN WHEN user uses keyboard to select =", () => {
      it("THEN = is selected and focus moves to value", () => {
        cy.mount(<DefaultFilterBar />);

        cy.findByTestId("pre-filterbar").find("input").focus();
        cy.realPress("Tab");
        findAddButton().should("be.focused");
        cy.realPress("Enter");
        cy.findByRole("combobox").should("be.focused");

        // make sure columns list has renderered
        cy.findByText("currency").should("be.visible");
        cy.realPress("ArrowDown");
        cy.get(".saltOption-active").should("have.text", "currency");
        cy.realPress("Enter");

        cy.findByText("=").should("be.visible");
        cy.get(".saltOption-active").should("have.text", "=");
        cy.realPress("Enter");

        assertInputValue(".vuuFilterClauseOperator", "=");

        cy.get(".vuuFilterClauseValue input").should("be.focused");
        cy.get(".vuuFilterClauseValue input").should(
          "have.attr",
          "aria-expanded",
          "true",
        );
      });
      describe("THEN WHEN user uses keyboard to select USD", () => {
        it("THEN USD is selected,  and focus moves to Menu", () => {
          cy.mount(<DefaultFilterBar />);

          cy.findByTestId("pre-filterbar").find("input").focus();
          cy.realPress("Tab");
          findAddButton().should("be.focused");
          cy.realPress("Enter");
          cy.findByRole("combobox").should("be.focused");

          // make sure columns list has renderered
          cy.findByText("currency").should("be.visible");
          cy.realPress("ArrowDown");
          cy.get(".saltOption-active").should("have.text", "currency");
          cy.realPress("Enter");

          cy.findByText("=").should("be.visible");
          cy.realPress("Enter");

          cy.findByText("USD").should("be.visible");
          cy.realPress("ArrowDown");
          cy.realPress("ArrowDown");
          cy.realPress("ArrowDown");
          cy.realPress("ArrowDown");
          cy.realPress("Enter");

          assertInputValue(".vuuFilterClauseValue", "USD");

          cy.get(FILTER_CLAUSE).should("have.length", 1);
          cy.findByRole("button", { name: "Save" }).should("be.focused");
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
        today.getDate() + 1,
      );
    case "end-today":
      today.setHours(23, 59, 59, 999);
      return today;
  }
};

describe.only("WHEN a user applies a date filter", () => {
  const DATE_COLUMN = "lastUpdated";
  const startOfToday = getDate("start-today").getTime();
  const endOfToday = getDate("end-today").getTime();
  const startOfTomorrow = getDate("start-tomorrow").getTime();

  beforeEach(() => {
    const onApplyFilter = cy.stub().as("applyFilterHandler");
    const onFilterStateChanged = cy.stub().as("filterStateChangeHandler");
    cy.mount(
      <LocalDataSourceProvider>
        <DefaultFilterBar
          onApplyFilter={onApplyFilter}
          onFilterStateChanged={onFilterStateChanged}
        />
      </LocalDataSourceProvider>,
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
        name: `lastUpdated`,
      };

      // Add date filter
      findAddButton().realClick();
      clickListItems(DATE_COLUMN, op);
      cy.findByRole("textbox", { name: "Start date" }).should("be.focused");
      cy.realPress("ArrowDown");

      // cy.get(".vuuDatePopup .vuuIconButton").realClick();
      cy.get(`${VISIBLE_MONTH} .saltCalendarDay-today`).realClick();
      cy.realPress("ArrowRight");
      clickButton("Save");
      waitUntilEditableLabelIsFocused();
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
    }),
  );
});

describe("Deleting and renaming filters", () => {
  describe("WHEN user deletes a filter", () => {
    it("THEN onFilterDeleted callback is called", () => {
      const onFilterDeleted = cy.stub().as("onFilterDeleted");
      cy.mount(<FilterBarMultipleFilters onFilterDeleted={onFilterDeleted} />);

      findFilter("[data-index='0']")
        .find(".vuuSplitButton-trigger")
        .realClick();
      clickButton("Delete");
      clickDialogButton("Remove");

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

      findFilter("[data-index='0']")
        .find(".vuuSplitButton-trigger")
        .realClick();

      clickButton("Rename");

      waitUntilEditableLabelIsFocused();
      cy.realType("Test");
      pressEnterEditableLabel(0);

      cy.get("@onFilterRenamed").should(
        "be.calledWithExactly",
        {
          column: "currency",
          name: "Filter One",
          op: "=",
          value: "EUR",
        },
        "Test",
      );
    });
  });
});
