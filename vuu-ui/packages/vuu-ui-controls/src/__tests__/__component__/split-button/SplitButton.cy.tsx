import { DefaultSplitButton } from "../../../../../../showcase/src/examples/UiControls/SplitButton.examples";

describe("Given a SplitButton", () => {
  it("should apply correct aria attribues", () => {
    cy.mount(<DefaultSplitButton />);

    cy.findByRole("button").should("have.attr", "aria-haspopup", "menu");
    cy.findByRole("button").should("have.attr", "aria-expanded", "false");
    cy.findByRole("menu").should("not.exist");
  });
  describe("WHEN clicked", () => {
    it("THEN popup is displayed and aria attributes updated", () => {
      cy.mount(<DefaultPopupMenu />);
      cy.findByRole("button").realClick();
      cy.findByRole("button").should("have.attr", "aria-expanded", "true");
      cy.findByRole("menu").should("exist");
    });
  });

  describe("WHEN keyboard navigation used", () => {
    describe("AND user tabs to PopupMenu", () => {
      it("THEN PopupMenu receives focus", () => {
        cy.mount(<DefaultPopupMenu />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.findByRole("button").should("be.focused");
      });
    });
    describe("AND WHEN ENTER is pressed", () => {
      it("THEN Menu is displayed", () => {
        cy.mount(<DefaultPopupMenu />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress("Enter");
        cy.findByRole("button").should("have.attr", "aria-expanded", "true");
        cy.findByRole("menu").should("exist");
        cy.findByRole("menu").should("be.focused");
      });
    });
    describe("OR WHEN Space is pressed", () => {
      it("THEN Menu is displayed", () => {
        cy.mount(<DefaultPopupMenu />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress(" ");
        cy.findByRole("button").should("have.attr", "aria-expanded", "true");
        cy.findByRole("menu").should("exist");
      });
    });
    describe("AND if Escape is then pressed", () => {
      it("THEN Menu is hidden", () => {
        cy.mount(<DefaultPopupMenu />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress("Enter");
        cy.realPress("Escape");
        cy.findByRole("button").should("have.attr", "aria-expanded", "false");
        cy.findByRole("menu").should("not.exist");
      });
    });

    describe("OR if user clicks outside the PopupMenu", () => {
      it("THEN Menu is hidden", () => {
        cy.mount(<DefaultPopupMenu />);
        cy.findByRole("button").realClick();
        cy.findByRole("menu").should("exist");
        cy.findByTestId("input").realClick();
        cy.findByRole("menu").should("not.exist");
      });
    });

    describe("OR if user tabs away", () => {
      it("THEN Menu is hidden", () => {
        cy.mount(<DefaultPopupMenu />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress("Enter");
        cy.findByRole("menu").should("exist");
        cy.realPress("Tab");
        cy.findByRole("button").should("have.attr", "aria-expanded", "false");
        cy.findByRole("menu").should("not.exist");
        cy.findByRole("button").should("not.be.focused");
      });
    });
  });

  describe("WHEN Enter is pressed, with first menu item highlighted", () => {
    it("THEN menuActionHandler is invoked", () => {
      const menuHandlerSpy = cy.stub().as("menuActionHandler");
      cy.mount(<DefaultPopupMenu menuActionHandler={menuHandlerSpy} />);
      cy.findByRole("button").realClick();
      cy.findByRole("menuitem", { name: "Menu Item 1" }).should("exist");
      cy.wait(30);
      cy.realPress("Enter");
      cy.get("@menuActionHandler").should("have.been.calledWith", {
        type: "menu-action",
        menuId: "action-1",
        options: undefined,
      });
    });
  });

  describe("WHEN Menu is open", () => {
    it("THEN arrow keys can be used for list navigation", () => {
      const menuHandlerSpy = cy.stub().as("menuActionHandler");
      cy.mount(<DefaultPopupMenu menuActionHandler={menuHandlerSpy} />);
      cy.findByRole("button").realClick();
      cy.findByRole("menuitem", { name: "Menu Item 1" }).should("exist");
      cy.wait(30);
      cy.realPress("ArrowDown");
      cy.realPress("Enter");
      cy.get("@menuActionHandler").should("have.been.calledWith", {
        type: "menu-action",
        menuId: "action-2",
        options: undefined,
      });
    });
  });
});
