import {
  EditMultiClauseOrFilter,
  NewFilter,
} from "../../../../../showcase/src/examples/Filters/FilterEditor.examples";
import { FilterBarOneSimpleFilter } from "../../../../../showcase/src/examples/Filters/FilterBar/FilterBar.examples";

import { clickFilterPillTrigger, clickMenuItem } from "./filter-test-utils";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { FilterEditorProps } from "../../filter-editor";

const NewFilterFixture = (props: Partial<FilterEditorProps>) => (
  <LocalDataSourceProvider>
    <NewFilter {...props} />
  </LocalDataSourceProvider>
);

const EditMultiClauseOrFilterFixture = (props: Partial<FilterEditorProps>) => (
  <LocalDataSourceProvider>
    <EditMultiClauseOrFilter {...props} />
  </LocalDataSourceProvider>
);

const FilterBarOneSimpleFilterFixture = () => (
  <LocalDataSourceProvider>
    <FilterBarOneSimpleFilter />
  </LocalDataSourceProvider>
);

const assertComboboxReady = () => {
  cy.findByRole("combobox").should("be.focused");
  cy.findByRole("listbox").should("be.visible");
};

const EnterAndAssertListVisible = () => {
  cy.realPress("Enter");
  cy.findByRole("listbox").should("be.visible");
};

const clickListItem = (name: string) => {
  cy.findByRole("option", { name }).realHover();
  cy.findByRole("option", { name }).realClick();
  cy.wait(50);
};

const selectMenuOption = (name: "AND" | "OR") => {
  cy.findAllByRole("button", { name: "Save" }).should("be.focused");
  cy.realPress("ArrowDown");
  cy.findByRole("menu").should("be.visible");
  // cy.findByRole("menuitem", { name }).should(
  //   "have.class",
  //   "vuuHighlighted",
  //   "true",
  // );
  // TODO WHY doesn't ENTER work ?
  cy.findByRole("menuitem", { name }).realClick();
  // cy.realPress("Enter");
};

describe("FilterEditor", () => {
  describe("WHEN rendered with new FilterClauseModel", () => {
    it("THEN it renders with a single clause, with column field only", () => {
      cy.mount(<NewFilterFixture />);
      cy.findAllByRole("combobox").should("have.length", 1);
    });
    it("THEN save button is disabled as Clause is invalid", () => {
      cy.mount(<NewFilterFixture />);
      cy.findByRole("button", { name: "Save" }).should("be.disabled");
    });

    it("THEN it renders with first field focused, ready to select", () => {
      cy.mount(<NewFilterFixture />);
      cy.findByRole("combobox").should("be.focused");
      cy.findByRole("listbox").should("be.visible");
    });

    describe("WHEN Enter is pressed on default selection", () => {
      it("THEN first column is selected and operator focused", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        cy.realPress("Enter");
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("combobox").should("have.length", 2);
        cy.findAllByRole("combobox").eq(1).should("be.focused");
      });
    });
    describe("WHEN Enter is pressed twice to accept default selections", () => {
      it("THEN filter clause value is focused", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        cy.realPress("Enter");
        cy.findByRole("listbox").should("be.visible");
        cy.realPress("Enter");
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("combobox").should("have.length", 3);
        cy.findAllByRole("combobox").eq(2).should("be.focused");
      });
    });
    describe("WHEN Enter is pressed three times to accept default selections", () => {
      it("THEN filterClause is valid and Save button is enabled", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        cy.realPress("Enter");
        cy.findByRole("listbox").should("be.visible");
        cy.realPress("Enter");
        cy.findByRole("listbox").should("be.visible");
        cy.realPress("Enter");
        cy.findByRole("listbox").should("not.exist");
        cy.findAllByRole("combobox").should("have.length", 3);
        cy.findByRole("button", { name: "Save" }).should("not.be.disabled");
        cy.findByRole("button", { name: "Save" }).should("be.focused");
      });
    });

    describe("WHEN Enter is pressed until clause complete, then save pressed", () => {
      it("THEN save button is focused", () => {
        const saveFilterSpy = cy.stub().as("saveFilterHandler");
        cy.mount(<NewFilterFixture onSave={saveFilterSpy} />);
        assertComboboxReady();
        EnterAndAssertListVisible();
        EnterAndAssertListVisible();
        cy.realPress("Enter");
        cy.findByRole("button", { name: "Save" }).should("be.focused");
        cy.realPress("Enter");
        cy.findByRole("button", { name: "Save" }).should("be.focused");
      });
    });

    describe("WHEN Enter is pressed until clause complete, then save pressed", () => {
      it("THEN save callback is invoked", () => {
        const saveFilterSpy = cy.stub().as("saveFilterHandler");
        cy.mount(<NewFilterFixture onSave={saveFilterSpy} />);
        assertComboboxReady();
        EnterAndAssertListVisible();
        EnterAndAssertListVisible();
        cy.realPress("Enter");
        cy.findByRole("button", { name: "Save" }).should("be.focused");
        cy.realPress("Enter");
        cy.get("@saveFilterHandler").should("have.been.called");
      });
    });
  });

  describe("Multi clause filters", () => {
    describe("WHEN Enter is pressed until clause complete, then AND pressed", () => {
      it("THEN filter combinator (AND) is rendered", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();

        EnterAndAssertListVisible();
        EnterAndAssertListVisible();
        cy.realPress("Enter");

        selectMenuOption("AND");
        cy.findByRole("button", { name: "and" }).should("be.visible");
        cy.findAllByRole("button", { name: "and" }).should("have.length", 1);
      });
      it("THEN second clause is created and column focused", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        EnterAndAssertListVisible();
        EnterAndAssertListVisible();
        cy.realPress("Enter");
        selectMenuOption("AND");
        cy.findAllByRole("combobox").should("have.length", 4);
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("combobox").eq(3).should("be.focused");
        cy.findByRole("button", { name: "Save" }).should("be.disabled");
      });
    });
    describe("WHEN second clause is completed and SAVE pressed", () => {
      it.skip("THEN two clause filter is saved", () => {
        const saveFilterSpy = cy.stub().as("saveFilterHandler");
        cy.mount(<NewFilterFixture onSave={saveFilterSpy} />);
        assertComboboxReady();
        EnterAndAssertListVisible();
        EnterAndAssertListVisible();
        cy.realPress("Enter");
        selectMenuOption("AND");
        cy.findByText("currency").should("be.visible");
        cy.realPress("ArrowDown");
        cy.findByRole("option", { name: "currency" }).should(
          "have.class",
          "saltOption-active",
        );
        EnterAndAssertListVisible();
        EnterAndAssertListVisible();
        cy.realPress("Enter");
        cy.findByRole("button", { name: "Save" }).should("be.enabled");
        cy.findByRole("button", { name: "Save" }).should("be.focused");

        cy.realPress("Enter");

        cy.get("@saveFilterHandler").should("have.been.calledWith", {
          op: "and",
          filters: [
            { column: "bbg", op: "=", value: "AAOO L" },
            { column: "currency", op: "=", value: "CAD" },
          ],
        });
      });
    });
  });

  describe("Arrow key navigation", () => {
    describe("within a single clause filter", () => {
      describe("WHEN clause complete and Save button focused, then Shift+Tab pressed", () => {
        it("THEN focus returns to last clause and last value is selected", () => {
          cy.mount(<NewFilterFixture />);
          assertComboboxReady();
          cy.realPress("Enter");
          cy.findByRole("listbox").should("be.visible");
          cy.realPress("Enter");
          cy.findByRole("listbox").should("be.visible");
          cy.realPress("Enter");
          cy.findByRole("button", { name: "Save" }).should("be.focused");
          cy.realPress(["Shift", "Tab"]);
          cy.findAllByRole("combobox").eq(2).should("be.focused");
          cy.findByRole("listbox").should("be.visible");
          // we can't directly test selected text,  but if we use backspace
          // input text is cleared, indicating that text was selected
          cy.realPress("Backspace");
          cy.findAllByRole("combobox").eq(2).should("have.attr", "value", "");
        });
        describe("AND THEN ArrowLeft is pressed", () => {
          it.skip("THEN focus moves from value to operator and text is selected", () => {
            cy.mount(<NewFilterFixture />);
            assertComboboxReady();
            cy.realPress("Enter");
            cy.findByRole("listbox").should("be.visible");
            cy.realPress("Enter");
            cy.findByRole("listbox").should("be.visible");
            cy.realPress("Enter");
            cy.findByRole("button", { name: "Save" }).should("be.focused");
            cy.realPress(["Shift", "Tab"]);
            cy.realPress("ArrowLeft");
            cy.findAllByRole("combobox").eq(1).should("be.focused");
            cy.findByRole("listbox").should("be.visible");
            // we can't directly test selected text,  but if we use backspace
            // input text is cleared, indicating that text was selected
            cy.realPress("Backspace");
            cy.findAllByRole("combobox").eq(1).should("have.attr", "value", "");
          });
        });
        describe("AND THEN ArrowLeft is pressed once more", () => {
          it("THEN focus moves from operator to column and text is selected", () => {
            cy.mount(<NewFilterFixture />);
            assertComboboxReady();
            cy.realPress("Enter");
            cy.findAllByRole("combobox").eq(1).should("be.focused");
            cy.findByRole("listbox").should("be.visible");
            cy.realPress("Enter");
            cy.findAllByRole("combobox").eq(2).should("be.focused");
            cy.findByRole("listbox").should("be.visible");
            cy.realPress("Enter");
            cy.findByRole("button", { name: "Save" }).should("be.focused");
            cy.realPress(["Shift", "Tab"]);
            cy.findAllByRole("combobox").eq(2).should("be.focused");
            cy.realPress("ArrowLeft");
            cy.findAllByRole("combobox").eq(1).should("be.focused");
            cy.realPress("ArrowLeft");
            cy.findAllByRole("combobox").eq(0).should("be.focused");
            cy.findByRole("listbox").should("be.visible");
            // we can't directly test selected text,  but if we use backspace
            // input text is cleared, indicating that text was selected
            cy.realPress("Backspace");
            cy.findAllByRole("combobox").eq(0).should("have.attr", "value", "");
          });
        });
      });
    });
    describe("within a multi clause filter", () => {
      describe("WHEN right arrow is repeatedly pressed", () => {
        it.skip("THEN focus moves from field to field, first selecting then deselecting, then across combinators and clauses", () => {
          cy.mount(<EditMultiClauseOrFilterFixture />);
          cy.findAllByRole("combobox").should("have.length", 6);
          cy.findAllByRole("combobox").eq(0).should("be.focused");
          // One keypress selects text, next deselects, leaving cursor at end
          // don't have a good way to assert selection yet
          cy.realPress("ArrowRight");
          cy.realPress("ArrowRight");
          cy.findAllByRole("combobox").eq(1).should("be.focused");
          cy.realPress("ArrowRight");
          cy.realPress("ArrowRight");
          cy.findAllByRole("combobox").eq(2).should("be.focused");
          cy.realPress("ArrowRight");
          cy.realPress("ArrowRight");
          cy.findByRole("button", { name: "or" }).should("be.focused");
          cy.realPress("ArrowRight");
          cy.realPress("ArrowRight");
          cy.findAllByRole("combobox").eq(3).should("be.focused");
          cy.realPress("ArrowRight");
          cy.realPress("ArrowRight");
          cy.findAllByRole("combobox").eq(4).should("be.focused");
          cy.realPress("ArrowRight");
          cy.realPress("ArrowRight");
          cy.findAllByRole("combobox").eq(5).should("be.focused");
          // once at the end, we don't go any further without Tabbing
          cy.realPress("ArrowRight");
          cy.findAllByRole("combobox").eq(5).should("be.focused");
        });
      });
      describe("WHEN left arrow is repeatedly pressed from end of FilterEditor", () => {
        it("THEN focus moves from field to field, first selecting then deselecting, then across combinators and clauses", () => {
          cy.mount(<EditMultiClauseOrFilterFixture />);
          cy.findAllByRole("combobox").should("have.length", 6);

          cy.findByRole("button", { name: "Save" }).realClick();
          cy.findByRole("button", { name: "Save" }).should("be.focused");
          cy.realPress(["Shift", "Tab"]);
          cy.findAllByRole("combobox").eq(5).should("be.focused");
          cy.realPress("ArrowLeft");
          cy.findAllByRole("combobox").eq(4).should("be.focused");
          cy.realPress("ArrowLeft");
          cy.findAllByRole("combobox").eq(3).should("be.focused");
          cy.realPress("ArrowLeft");
          cy.findByRole("button", { name: "or" }).should("be.focused");
          cy.realPress("ArrowLeft");
          cy.findAllByRole("combobox").eq(2).should("be.focused");
          cy.realPress("ArrowLeft");
          cy.findAllByRole("combobox").eq(1).should("be.focused");
          cy.realPress("ArrowLeft");
          cy.findAllByRole("combobox").eq(0).should("be.focused");
          // once at the end, we don't go any further without Tabbing
          cy.realPress("ArrowLeft");
          cy.findAllByRole("combobox").eq(0).should("be.focused");
        });
      });
    });
  });

  describe("WHEN user chooses starts operator", () => {
    it("THEN suggestions are illustrative only and are disabled", () => {
      cy.mount(<NewFilterFixture />);
      assertComboboxReady();
      clickListItem("description");
      clickListItem("starts");
      cy.findAllByRole("option").should("have.length", 10);
      cy.findAllByRole("option")
        .eq(0)
        .should("have.attr", "aria-disabled", "true");
    });
    describe("AND WHEN no value has yet been entered", () => {
      it("THEN save button is disabled", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        clickListItem("description");
        clickListItem("starts");
        cy.findByRole("button", { name: "Save" }).should("be.disabled");
      });
    });
    describe("AND WHEN first character of value is entered", () => {
      it("THEN save button is enabled", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        clickListItem("description");
        clickListItem("starts");
        cy.findAllByRole("combobox").eq(2).should("be.focused");
        cy.realType("A");
        cy.findByRole("button", { name: "Save" }).should("be.enabled");
      });
      describe("AND WHEN Enter is then pressed", () => {
        it("THEN Save button is focused", () => {
          cy.mount(<NewFilterFixture />);
          assertComboboxReady();
          clickListItem("description");
          clickListItem("starts");
          cy.findAllByRole("combobox").eq(2).should("be.focused");
          cy.realType("A");
          cy.realPress("Enter");
          cy.findByRole("button", { name: "Save" }).should("be.focused");
        });
      });
      describe("OR WHEN Tab is then pressed", () => {
        it("THEN Save button is focused", () => {
          cy.mount(<NewFilterFixture />);
          assertComboboxReady();
          clickListItem("description");
          clickListItem("starts");
          cy.findAllByRole("combobox").eq(2).should("be.focused");
          cy.realType("A");
          cy.realPress("Tab");
          cy.findByRole("button", { name: "Save" }).should("be.focused");
        });
      });
    });
    describe("AND WHEN all characters are deleted", () => {
      it("THEN save button is disabled", () => {
        cy.mount(<NewFilterFixture />);
        assertComboboxReady();
        clickListItem("description");
        clickListItem("starts");
        cy.findAllByRole("combobox").eq(2).should("be.focused");
        cy.realType("A");
        cy.realPress("Backspace");
        cy.findByRole("button", { name: "Save" }).should("be.disabled");
      });
    });
  });

  describe("WHEN a clause users a numeric column", () => {
    it("THEN appropriate operators are offered", () => {
      cy.mount(<NewFilterFixture />);
      clickListItem("lotSize");
      cy.findByRole("option", { name: "=" }).should("exist");
      cy.findByRole("option", { name: "!=" }).should("exist");
      cy.findByRole("option", { name: ">" }).should("exist");
      cy.findByRole("option", { name: ">=" }).should("exist");
      cy.findByRole("option", { name: "<" }).should("exist");
      cy.findByRole("option", { name: "<=" }).should("exist");
      cy.findByRole("option", { name: "starts" }).should("not.exist");
    });

    describe("AND WHEN numeric value is entered", () => {
      describe("AND THEN Enter is pressed", () => {
        it("THEN clause is created and Save button enabled", () => {
          cy.mount(<NewFilterFixture />);
          clickListItem("lotSize");
          cy.findByRole("option", { name: ">" }).realHover();
          cy.findByRole("option", { name: ">" }).realClick();

          cy.realType("1000");
          cy.realPress("Enter");

          cy.findByRole("button", { name: "Save" }).should("be.focused");
          cy.findByRole("button", { name: "Save" }).should("be.enabled");
        });
      });
      describe("OR WHEN Tab is pressed", () => {
        it("THEN clause is created and Save button enabled", () => {
          cy.mount(<NewFilterFixture />);
          clickListItem("lotSize");
          cy.findByRole("option", { name: ">" }).realHover();
          cy.findByRole("option", { name: ">" }).realClick();

          cy.realType("1000");
          cy.realPress("Tab");

          cy.findByRole("button", { name: "Save" }).should("be.focused");
          cy.findByRole("button", { name: "Save" }).should("be.enabled");
        });
      });
      describe("AND THEN backspace is used to erase value and backspace again", () => {
        it("THEN value input is removed and focus returned to operator", () => {
          cy.mount(<NewFilterFixture />);
          clickListItem("lotSize");
          cy.findByRole("option", { name: ">" }).realHover();
          cy.findByRole("option", { name: ">" }).realClick();
          cy.findByRole("textbox").should("be.focused");

          cy.realType("1000");
          cy.realPress("Backspace");
          cy.realPress("Backspace");
          cy.realPress("Backspace");
          cy.realPress("Backspace");
          cy.realPress("Backspace");
          cy.findAllByRole("combobox").should("have.length", 2);
          cy.findAllByRole("combobox").eq(1).should("be.focused");
          cy.findByRole("listbox").should("be.visible");
        });
      });
    });
  });

  describe("WHEN rendered with an existing  Filter", () => {
    //   it("renders multiple clauses and save button is disabled", () => {
    //     cy.mount(<EditMultiClauseOrFilter />);
    //     cy.findAllByRole("combobox").should("have.length", 6);
    //     cy.findAllByRole("button", { name: "Save" }).should("be.disabled");
    //   });
  });

  describe("Cancel Edit", () => {
    describe("WHEN user presses Esc on first entering edit mode", () => {
      it("THEN column dropdown is closed", () => {
        cy.mount(<FilterBarOneSimpleFilterFixture />);
        clickFilterPillTrigger();
        clickMenuItem("Edit");
        cy.get(".vuuFilterEditor").should("be.visible");
        cy.findByRole("listbox").should("be.visible");
        cy.realPress("Escape");
        cy.get(".vuuFilterEditor").should("be.visible");
        cy.findByRole("listbox").should("not.exist");
      });
    });
    describe("WHEN user presses Esc again", () => {
      it("THEN FilterEditor is closed and FilterPill focused", () => {
        cy.mount(<FilterBarOneSimpleFilterFixture />);
        clickFilterPillTrigger();
        clickMenuItem("Edit");
        cy.get(".vuuFilterEditor").should("be.visible");
        cy.findByRole("listbox").should("be.visible");
        cy.realPress("Escape");
        cy.realPress("Escape");
        cy.get(".vuuFilterEditor").should("not.exist");
        cy.findByRole("button", { name: "Filter One" }).should("be.focused");
      });
    });

    describe("WHEN user presses Esc whilst on Save button", () => {
      it("THEN FilterEditor is closed and FilterPill focused", () => {
        cy.mount(<FilterBarOneSimpleFilterFixture />);
        clickFilterPillTrigger();
        clickMenuItem("Edit");
        cy.get(".vuuFilterEditor").should("be.visible");

        cy.findByRole("listbox").should("be.visible");
        cy.realPress("Tab");
        cy.findByRole("button", { name: "Save" }).should("be.focused");

        cy.realPress("Escape");
        cy.get(".vuuFilterEditor").should("not.exist");
        cy.findByRole("button", { name: "Filter One" }).should("be.focused");
      });
    });
  });
});
