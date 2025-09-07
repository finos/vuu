import { DefaultModalProvider } from "../../../../../showcase/src/examples/UiControls/ModalProvider.examples";

describe("ModalProvider", () => {
  it("WHEN modal dialog is triggered", () => {
    cy.mount(<DefaultModalProvider />);
    cy.findByTestId("dialog-trigger").realClick();
    const dialog = cy.findByRole("dialog");
    dialog.should("be.visible");
    cy.realPress("Escape");
    cy.findByRole("dialog").should("not.exist");
  });

  it("WHEN modal prompt is triggered", () => {
    cy.mount(<DefaultModalProvider />);
    cy.findByTestId("prompt-trigger").realClick();
    const dialog = cy.findByRole("dialog");
    dialog.should("be.visible");
    dialog.should("have.class", "vuuPrompt");
    cy.realPress("Escape");
    cy.findByRole("dialog").should("not.exist");
  });
});
