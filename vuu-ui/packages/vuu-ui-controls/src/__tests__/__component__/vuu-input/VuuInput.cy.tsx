import {
  DefaultVuuInput,
  VuuInputWithErrorMessageTooltipRight,
} from "../../../../../../showcase/src/examples/UiControls/VuuInput.examples";

describe("VuuInput", () => {
  describe("Given a default VuuInput", () => {
    it("Then basic smoke-test passes", () => {
      cy.mount(<DefaultVuuInput />);
      cy.findByTestId("vuu-input").should("have.class", "vuuInput");
      cy.findByTestId("vuu-input").should("be.visible");
      cy.findByTestId("vuu-input").find("input").should("be.visible");
    });
  });

  describe("When provided with an error message", () => {
    it("Then an error classname and indicator will be rendered", () => {
      cy.mount(<VuuInputWithErrorMessageTooltipRight />);
      cy.findByTestId("vuu-input").should("have.class", "vuuInput-error");
      cy.findByTestId("vuu-input")
        .find(".vuuInput-errorIcon")
        .should("be.visible");
    });

    describe("And when user hovers error icon", () => {
      it("Then tooltip will be displayed", () => {
        cy.mount(<VuuInputWithErrorMessageTooltipRight />);
        cy.findByTestId("vuu-input").find(".vuuInput-errorIcon").realHover();
        cy.get(".vuuTooltip").should("be.visible");
      });
    });
  });
});
