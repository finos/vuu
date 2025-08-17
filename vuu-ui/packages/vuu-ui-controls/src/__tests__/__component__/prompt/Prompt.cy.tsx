import {
  BareBonesPrompt,
  ConfirmOnly,
  FocusOnConfirm,
} from "../../../../../../showcase/src/examples/UiControls/Prompt.examples";

describe("WHEN rendered with open true", () => {
  it("THEN Prompt renders in portal", () => {
    cy.mount(<BareBonesPrompt />);
    cy.findByRole("dialog").should("be.visible");
    cy.findByRole("dialog").should("have.class", "vuuPromptNext");
  });
});
describe("WHEN configured to show confirm button only, with custom label", () => {
  it("THEN neither the close button nor cancel button will be rendered", () => {
    cy.mount(<ConfirmOnly />);
    cy.findByRole("dialog").should("be.visible");
    cy.findAllByRole("button").should("have.length", 1);
    cy.findByRole("button", { name: "OK" }).should("be.visible");
    cy.findByRole("button", { name: "OK" }).should("be.focused");
  });
});
describe("WHEN configured to focus on confirm", () => {
  it("THEN Prompt renders in portal", () => {
    cy.mount(<FocusOnConfirm />);
    cy.findByRole("dialog").should("be.visible");
    cy.findAllByRole("button").should("have.length", 3);
    cy.findByRole("button", { name: "Confirm" }).should("be.focused");
  });
});
