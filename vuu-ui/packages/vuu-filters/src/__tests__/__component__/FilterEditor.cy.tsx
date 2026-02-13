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

const clickListItem = (name: string) => {
  cy.findByRole("option", { name }).realHover();
  cy.findByRole("option", { name }).realClick();
  cy.wait(50);
};

describe("FilterEditor", () => {
  describe("WHEN user chooses starts operator", () => {
    it("THEN suggestions are illustrative only and are disabled", () => {
      cy.mount(<NewFilterFixture />);
      assertComboboxReady();
      clickListItem("description");
      clickListItem("starts");

      cy.findByRole("option", { name: "AAOO.L description" }).should(
        "have.attr",
        "aria-disabled",
        "true",
      );
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
