import { formatDate } from "@finos/vuu-utils";
import { SHELL_WITH_NEW_THEME_URL } from "../support/e2e/constants";

export class ShellWithNewTheme {
  visit: () => void = () => {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  };

  getContextMenuButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy
      .findByRole("tablist", { name: "data tabs" })
      .findAllByRole("tab")
      .first()
      .findByRole("button", { name: "context menu" });
  };

  getSaveLayoutButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("menuitem", { name: "Save Layout" });
  };

  getMyLayoutsButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("tab", { name: "MY LAYOUTS" });
  };

  getLayoutTile: (
    layoutName: string,
    group: string,
    creator: string,
    date: Date
  ) => Cypress.Chainable<JQuery<HTMLElement>> = (
    layoutName: string,
    group: string,
    creator: string,
    date: Date
  ) => {
    const formattedDate = formatDate({ date: "ddmmyyyy" })(date);
    const layoutTileName = `${layoutName} ${creator}, ${formattedDate}`;

    return cy
      .findByRole("listbox", { name: "my layouts" })
      .findByRole("list", { name: group })
      .findByRole("listitem", { name: layoutTileName })
      .findByRole("button");
  };
}
