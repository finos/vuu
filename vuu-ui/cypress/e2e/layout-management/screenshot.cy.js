import "cypress-iframe";
import { ShellWithNewTheme } from "../../pages/ShellWithNewTheme";
import { SaveLayoutDialog } from "../../pages/SaveLayoutDialog";

const page = new ShellWithNewTheme();
const dialog = new SaveLayoutDialog();

context("Screenshot", () => {
  beforeEach(() => {
    page.visit();
  });

  it("Takes a screenshot of the current layout and displays it in the save layout dialog", () => {
    page.getContextMenuButton().click();
    page.getSaveLayoutButton().click();

    dialog
      .getScreenshot()
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });
  });
});
