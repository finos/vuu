import { formatDate } from "@finos/vuu-utils";
import { SHELL_WITH_NEW_THEME_URL } from "../support/e2e/constants";

export class ShellWithNewTheme {
  visit: () => void = () => {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  };

  getTabs: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("tablist", { name: "data tabs" }).findAllByRole("tab");
  };

  getTab: (n: number) => Cypress.Chainable<JQuery<HTMLElement>> = (
    n: number
  ) => {
    return this.getTabs().eq(n);
  };

  getContextMenuButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return this.getTab(0).findByRole("button", { name: "context menu" });
  };

  getSaveLayoutButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("menuitem", { name: "Save Layout" });
  };

  getRenameLayoutButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("menuitem", { name: "Rename" });
  };

  getMyLayoutsButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("tab", { name: "MY LAYOUTS" });
  };

  getVuuTablesButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("tab", { name: "VUU TABLES" });
  };

  getFirstAvailableVuuTable: () => Cypress.Chainable<JQuery<HTMLElement>> =
    () => {
      return cy.findAllByRole("option").first();
    };

  getLayoutGroup: (group: string) => Cypress.Chainable<JQuery<HTMLElement>> = (
    group: string
  ) => {
    return cy
      .findByRole("listbox", { name: "my layouts" })
      .findByRole("list", { name: group });
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
    const formattedDate = formatDate({ date: "dd.mm.yyyy" })(date);
    const layoutTileName = `${layoutName} ${creator}, ${formattedDate}`;

    return this.getLayoutGroup(group).findByRole("button", {
      name: layoutTileName,
    });
  };

  getToasts: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findAllByRole("status");
  };

  getToastText: (text: string) => Cypress.Chainable<JQuery<HTMLElement>> = (
    text: string
  ) => {
    return cy.findByRole("status").findByText(text);
  };
}
