import { SHELL_WITH_NEW_THEME_URL } from "../support/e2e/constants";

export class ShellWithNewTheme {
  visit() {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  }

  getContextMenuButton() {
    return cy
      .findByRole("tablist", { name: "tab headers" })
      .findAllByRole("tab")
      .first()
      .findByRole("button");
  }

  getSaveLayoutButton() {
    return cy.findByRole("menuitem", { name: "Save Layout" });
  }

  getLayoutScreenshot() {
    return cy
      .findByRole("dialog")
      .findByAltText("screenshot of current layout");
  }
}
