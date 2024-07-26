import {
  DefaultUserSettingsForm,
  ScrollableUserSettingsPanel,
  VariedFormControlUserSettingsForm,
} from "../../../../../showcase/src/examples/Shell/UserSettings.examples";




// Tests for current default user settings panel with only one toggle button form control
describe("Given a single toggle button form control", () => {
  it("should have two buttons, with one selected", () => {
    cy.mount(<DefaultUserSettingsForm />);
    cy.contains("button", "light").should("have.attr", "aria-checked", "true");
    cy.contains("button", "dark").should("have.attr", "aria-checked", "false");
  });
  describe("WHEN the toggle buttons are selected ", () => {
    it("should become selected", () => {
      cy.mount(<DefaultUserSettingsForm />);
      // Clicks and checks the dark button
      cy.contains("button", "dark").click();
      cy.should("have.attr", "aria-checked", "true");
      cy.contains("button", "light").should(
        "have.attr",
        "aria-checked",
        "false"
      );
      // Clicks and checks the light button
      cy.contains("button", "light").click();
      cy.should("have.attr", "aria-checked", "true");
      cy.contains("button", "dark").should(
        "have.attr",
        "aria-checked",
        "false"
      );
    });
  });
});

// Tests for settings form with multiple components
describe("Given a form with multiple form controls of different types", () => {
  it("the button element should have the correct attributes", () => {
    cy.mount(<VariedFormControlUserSettingsForm />);
    cy.get('[data-field="themeMode"]')
      .find("button.saltToggleButton")
      .contains("dark")
      .should("have.attr", "aria-checked", "false");
    cy.get('[data-field="themeMode"]')
      .find("button.saltToggleButton")
      .contains("light")
      .should("have.attr", "aria-checked", "true");
  });
  //Think of better attributes to check - something
  it("the dropdown elements should have the correct attributes", () => {
    cy.mount(<VariedFormControlUserSettingsForm />);
    cy.get('[data-field="dateFormatPattern"]')
      .find("button.saltDropdown")
      .should("have.attr", "role", "combobox");
    cy.get('[data-field="region"]')
      .find("button.saltDropdown")
      .should("have.attr", "role", "combobox");
  });
  it("the switch element should have the correct attributes", () => {
    cy.mount(<VariedFormControlUserSettingsForm />);
    cy.get(".saltSwitch-input").should("have.attr", "type", "checkbox");
  });
  describe("WHEN the dropdown is changed", () => {
    it("should change the displayed text on the dropdown", () => {
      cy.mount(<VariedFormControlUserSettingsForm />);
      //Tests the date format pattern dropdown
      cy.get('[data-field="dateFormatPattern"]')
        .find("button.saltDropdown")
        .click();
      cy.contains(".saltOption", "mm/dd/yyyy").click();
      cy.get('[data-field="dateFormatPattern"]')
        .find("button.saltDropdown")
        .should("have.text", "mm/dd/yyyy");
      cy.get('[data-field="dateFormatPattern"]')
        .find("button.saltDropdown")
        .click();
      cy.contains(".saltOption", "dd MM yyyy").click();
      cy.get('[data-field="dateFormatPattern"]')
        .find("button.saltDropdown")
        .should("have.text", "dd MM yyyy");
      cy.get('[data-field="dateFormatPattern"]')
        .find("button.saltDropdown")
        .click();
      cy.contains(".saltOption", "dd/mm/yyyy").click();
      cy.get('[data-field="dateFormatPattern"]')
        .find("button.saltDropdown")
        .should("have.text", "dd/mm/yyyy");
      // Tests the region dropdowns
      cy.get('[data-field="region"]').find("button.saltDropdown").click();
      cy.contains(".saltOption", "Asia Pacific").click();
      cy.get('[data-field="region"]')
        .find("button.saltDropdown")
        .should("have.text", "Asia Pacific");
      cy.get('[data-field="region"]').find("button.saltDropdown").click();
      cy.contains(".saltOption", "Europe, Middle East & Africa").click();
      cy.get('[data-field="region"]')
        .find("button.saltDropdown")
        .should("have.text", "Europe, Middle East & Africa");
      cy.get('[data-field="region"]').find("button.saltDropdown").click();
      cy.contains(".saltOption", "US").click();
      cy.get('[data-field="region"]')
        .find("button.saltDropdown")
        .should("have.text", "US");
    });
  });
  describe("WHEN the switch form controlled is clicked", () => {
    it("should change colour", () => {
      cy.mount(<VariedFormControlUserSettingsForm />);
      cy.get('[data-field="greyscale"]').find("input.saltSwitch-input").click();
      cy.get('[data-field="greyscale"]')
        .find(".saltIcon")
        .should("have.attr", "aria-label", "success small solid");
    });
  });
});

// Tests for scrolling functionality of form with multiple components
describe("Given a form with a large number of components", () => {
  it("should scroll", () => {
    cy.mount(<ScrollableUserSettingsPanel />);
    cy.get('[data-field="field1"]').should("be.visible");
    // cy.get('[data-field="field45"]').should("not.be.visible");
    cy.scrollTo("bottom");
    cy.wait(500);
    // cy.get('[data-field="field1"]').should("not.be.visible");
    cy.get('[data-field="field45"]').should("be.visible");
    cy.scrollTo("top");
  });
});
