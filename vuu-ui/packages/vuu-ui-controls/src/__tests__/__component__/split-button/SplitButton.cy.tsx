import { DefaultSplitButton } from "../../../../../../showcase/src/examples/UiControls/SplitButton.examples";

describe("Given a (non segmented) SplitButton", () => {
  it("should have correct tabindex", () => {
    cy.mount(<DefaultSplitButton data-testid="split-button" />);
    cy.findByTestId("split-button").should("have.attr", "tabindex", "0");
    // prettier-ignore
    cy.findAllByRole("button").eq(1).should("have.attr", "aria-haspopup", "menu");
    // prettier-ignore
    cy.findAllByRole("button").eq(1).should("have.attr", "aria-expanded", "false");
    cy.findAllByRole("button").eq(1).should("have.attr", "tabindex", "-1");
  });

  describe("WHEN main button clicked", () => {
    it("THEN main button action is invoked", () => {
      const clickHandlerSpy = cy.stub().as("clickHandler");

      cy.mount(<DefaultSplitButton onClick={clickHandlerSpy} />);
      cy.findAllByRole("button").eq(0).realClick();
      cy.get("@clickHandler").should("have.been.called");
    });
  });

  describe("WHEN secondary button clicked", () => {
    it("THEN popup is displayed", () => {
      const clickHandlerSpy = cy.stub().as("clickHandler");
      cy.mount(<DefaultSplitButton onClick={clickHandlerSpy} />);
      cy.findAllByRole("button").eq(1).realClick();
      cy.get("@clickHandler").should("not.have.been.called");
      cy.findByRole("menu").should("exist");
    });
  });

  describe("WHEN keyboard navigation used", () => {
    describe("AND user tabs to SplitButton", () => {
      it("THEN Main Button is focused", () => {
        cy.mount(<DefaultSplitButton />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.findAllByRole("button").eq(0).should("be.focused");
      });
    });
    describe("AND WHEN ENTER is pressed", () => {
      it("THEN main button is activated", () => {
        const clickHandlerSpy = cy.stub().as("clickHandler");
        cy.mount(<DefaultSplitButton onClick={clickHandlerSpy} />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress("Enter");
        cy.get("@clickHandler").should("have.been.called");
      });
    });
    describe("OR WHEN Space is pressed", () => {
      it("THEN main button is activated", () => {
        const clickHandlerSpy = cy.stub().as("clickHandler");
        cy.mount(<DefaultSplitButton onClick={clickHandlerSpy} />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress(" ");
        cy.get("@clickHandler").should("have.been.called");
      });
    });

    describe("AND WHEN ArrowDown is pressed", () => {
      it("THEN menu is opened", () => {
        const clickHandlerSpy = cy.stub().as("clickHandler");
        cy.mount(<DefaultSplitButton onClick={clickHandlerSpy} />);
        cy.findByTestId("input").realClick();
        cy.realPress("Tab");
        cy.realPress("ArrowDown");
        cy.findByRole("menu").should("exist");
        // prettier-ignore
        cy.findAllByRole("button").eq(1).should("have.attr", "aria-expanded", "true");
        cy.get("@clickHandler").should("not.have.been.called");
      });
    });
  });
});
