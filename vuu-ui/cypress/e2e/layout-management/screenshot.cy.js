import "cypress-iframe";
import { SHELL_WITH_NEW_THEME_URL } from "../../support/e2e/constants";

context("Screenshot", () => {
  beforeEach(() => {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  });

  it("Takes a screenshot of the current layout and displays it in the save layout dialog", () => {
    // Click the menu button
    // TODO: Give the button and tab an accessible selector
    cy.findByRole("tab", { name: "My Instruments" }).then((tab) => {
      cy.wrap(tab).findByRole("button").click();
    });

    // Click the save layout button
    // TODO: Can this be more accessible?
    cy.findByRole("menuitem", { name: "Save Layout" }).click();

    // Check the screenshot is displayed
    // TODO: Don't find by classname, use an accessible selector
    cy.get(".vuuSaveLayoutPanel").then((dialog) => {
      cy.wrap(dialog)
        .find("img")
        .should("be.visible")
        .and(($img) => {
          expect($img[0].naturalWidth).to.be.greaterThan(0);
        });
    });
  });
});
