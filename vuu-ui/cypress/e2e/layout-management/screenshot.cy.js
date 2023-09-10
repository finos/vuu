import "cypress-iframe";
import { SHELL_WITH_NEW_THEME_URL } from "../../support/e2e/constants";

context("Screenshot", () => {
  beforeEach(() => {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  });

  // TODO (#VUU24): Improve test alignment with the user flow
  it("Takes a screenshot of the current layout and displays it in the save layout dialog", () => {
    // TODO (#VUU24): Improve selector
    cy.findByRole("tab", { name: "My Instruments" }).then((tab) => {
      cy.wrap(tab).findByRole("button").click();
    });

    // TODO (#VUU24): Improve selector
    cy.findByRole("menuitem", { name: "Save Layout" }).click();

    // TODO (#VUU24): Don't find by classname, use an accessible selector
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
