import "cypress-iframe";
import { SHELL_WITH_NEW_THEME_URL } from "../../support/e2e/constants";

context("Screenshot", () => {
  beforeEach(() => {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  });

  // TODO (#VUU24): Improve test alignment with the user flow
  it("Takes a screenshot of the current layout and displays it in the save layout dialog", () => {
    cy.findByRole("tablist", { name: "tab headers" })
      .findAllByRole("tab")
      .first()
      .findByRole("button")
      .click();

    cy.findByRole("menuitem", { name: "Save Layout" }).click();

    cy.findByRole("dialog")
      .findByAltText("screenshot of current layout")
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });
  });
});
