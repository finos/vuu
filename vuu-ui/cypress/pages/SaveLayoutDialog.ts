export class SaveLayoutDialog {
  getScreenshot: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByAltText("screenshot of current layout");
  }

  getGroupField: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("combobox", { name: "Group" });
  }

  getNameField: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("textbox", { name: "Layout Name" });
  }

  getSaveButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("dialog").findByRole("button", { name: "Save" });
  }

  getCancelButton: () => Cypress.Chainable<JQuery<HTMLElement>> = () => {
    return cy.findByRole("dialog").findByRole("button", { name: "Cancel" });
  }
}
