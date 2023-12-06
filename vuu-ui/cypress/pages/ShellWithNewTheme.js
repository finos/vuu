import { formatDate } from "@finos/vuu-utils";
import { SHELL_WITH_NEW_THEME_URL } from "../support/e2e/constants";

export class ShellWithNewTheme {
  visit() {
    cy.visit(SHELL_WITH_NEW_THEME_URL);
  }

  getContextMenuButton() {
    return cy
      .findByRole("tablist", { name: "layouts" })
      .findAllByRole("tab")
      .first()
      .findByRole("button", { name: "context menu" });
  }

  getSaveLayoutButton() {
    return cy.findByRole("menuitem", { name: "Save Layout" });
  }

  getMyLayoutsButton() {
    return cy.findByRole("tab", { name: "MY LAYOUTS" });
  }

  getLayoutTile(layoutName, group, creator, date) {
    const layoutTileName = `${layoutName} ${creator}, ${formatDate(date)}`;

    return cy
      .findByRole("listbox", { name: "my layouts" })
      .findByRole("list", { name: group })
      .findByRole("button", { name: layoutTileName });
  }
}
