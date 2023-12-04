export class SaveLayoutDialog {
  getScreenshot() {
    return cy.findByAltText("screenshot of current layout");
  }

  getGroupField() {
    return cy.findAllByRole("combobox", { name: "Group" });
  }

  getNameField() {
    return cy.findByRole("textbox", { name: "Layout Name" });
  }

  getSaveButton() {
    return cy.findByRole("dialog").findByRole("button", { name: "Save" });
  }

  getCancelButton() {
    return cy.findByRole("dialog").findByRole("button", { name: "Cancel" });
  }
}
