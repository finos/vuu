import "cypress-iframe";
import { ShellWithNewTheme } from "../../pages/ShellWithNewTheme";

const page = new ShellWithNewTheme();

context("Screenshot", () => {
  beforeEach(() => {
    page.visit();
  });

  // TODO (#VUU24): Improve test alignment with the user flow
  it("Takes a screenshot of the current layout and displays it in the save layout dialog", () => {
    page.getContextMenuButton().click();
    page.getSaveLayoutButton().click();

    page
      .getLayoutScreenshot()
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });
  });
});
