import { TabInAndOut } from "../../../../../showcase/src/examples/Table/Misc.examples";

describe("Cell navigation with keyboard", () => {
  describe("navigation from outside with Tab", () => {
    it.skip("begins navigation in first header cell", () => {
      cy.mount(<TabInAndOut />);
      cy.findByRole("table").should("be.visible");
      cy.findByTestId("input-start").realClick();
      // MAke sure we don't tab before the table has actually completed rendering
      cy.realPress("Tab");
      cy.findAllByRole("columnheader").eq(0).should("be.focused");
    });
  });

  describe("when columns contain column menu", () => {
    it("navigation goes from header to next header cell", () => {
      cy.mount(<TabInAndOut />);
      cy.findAllByRole("columnheader").eq(0).click();
      cy.findAllByRole("columnheader").eq(0).should("be.focused");
      cy.realPress("ArrowRight");
      cy.findAllByRole("columnheader").eq(1).should("be.focused");
      cy.realPress("ArrowRight");
      cy.findAllByRole("columnheader").eq(2).should("be.focused");
    });

    describe("and shift is pressed with Arrow key", () => {
      it("then column menu is included in navigation", () => {
        cy.mount(<TabInAndOut />);
        cy.findAllByRole("columnheader").eq(0).click();
        cy.realPress(["Shift", "ArrowRight"]);
        cy.findAllByRole("button").eq(0).should("be.focused");
        cy.realPress(["Shift", "ArrowRight"]);
        cy.findAllByRole("columnheader").eq(1).should("be.focused");
        cy.realPress(["Shift", "ArrowRight"]);
        cy.findAllByRole("button").eq(1).should("be.focused");
        cy.realPress(["Shift", "ArrowRight"]);
        cy.findAllByRole("columnheader").eq(2).should("be.focused");
        cy.realPress(["Shift", "ArrowRight"]);
        cy.findAllByRole("button").eq(2).should("be.focused");
      });
    });
  });

  describe("when column header cell focused", () => {
    describe("and UpArrow pressed", () => {
      it("does nothing", () => {
        cy.mount(<TabInAndOut />);
        cy.findAllByRole("columnheader").eq(0).click();
        cy.realPress("ArrowUp");
        cy.findAllByRole("columnheader").eq(0).should("be.focused");
      });
    });
    describe("and DownArrow pressed", () => {
      it("navigates to first data cell in same column", () => {
        cy.mount(<TabInAndOut />);
        cy.findAllByRole("columnheader").eq(0).click();
        cy.realPress("ArrowDown");
        cy.findAllByRole("row")
          .eq(1)
          .findAllByRole("cell")
          .eq(0)
          .should("be.focused");
      });
    });
  });
});
