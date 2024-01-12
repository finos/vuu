import "cypress-iframe";
import { ShellWithNewTheme } from "../../pages/ShellWithNewTheme";
import { SaveLayoutDialog } from "../../pages/SaveLayoutDialog";

const page = new ShellWithNewTheme();
const dialog = new SaveLayoutDialog();

context("Layout Management", () => {
  beforeEach(() => {
    page.visit();
  });

  it("Saves and reloads layout", () => {
    const savedLayoutName = "Saved Layout";
    const updatedLayoutName = "Updated Layout";
    const layoutGroup = "Layout Group";
    const layoutSaveName = "My Layout";

    // Update open layout
    page.getTab(0).dblclick();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.focused().type(`${savedLayoutName}{enter}`);

    // Save the updated layout
    page.getContextMenuButton().click();
    page.getSaveLayoutButton().click();

    dialog.getGroupField().type(layoutGroup);
    dialog.getNameField().clear().type(layoutSaveName);
    dialog.getSaveButton().click();

    // Verify success notification
    page.getToasts().should("have.length", 1);
    page.getToastText("Layout Saved Successfully").should("be.visible");
    page
      .getToastText(`${layoutSaveName} saved successfully`)
      .should("be.visible");

    // Update open layout again
    page.getTab(0).dblclick();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.focused().type(`${updatedLayoutName}{enter}`);

    // Load saved layout
    page.getMyLayoutsButton().click();
    page
      .getLayoutTile(layoutSaveName, layoutGroup, "test-user", new Date())
      .should("be.visible")
      .click();

    // Verify saved layout is loaded
    page.getTabs().should("have.length", 2);
    page.getTab(0).should("contain.text", updatedLayoutName);
    page.getTab(1).should("contain.text", savedLayoutName);
  });

  it("Does not save when cancel button is clicked", () => {
    const layoutGroup = "Layout Group";
    const layoutSaveName = "My Layout";

    // Go to save a layout, but cancel
    page.getContextMenuButton().click();
    page.getSaveLayoutButton().click();

    dialog.getGroupField().type(layoutGroup);
    dialog.getNameField().clear().type(layoutSaveName);
    dialog.getCancelButton().click();

    // Verify no notification
    page.getToasts().should("have.length", 0);

    // Verify no saved layouts show in drawer
    page.getMyLayoutsButton().click();
    page.getLayoutGroup(layoutGroup).should("not.exist");
  });
});
