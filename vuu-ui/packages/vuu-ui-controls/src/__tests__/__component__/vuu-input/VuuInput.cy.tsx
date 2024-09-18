import {
  DefaultVuuInput,
  VuuInputWithValidation,
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
});

describe("Given a VuuInput box with input validation", () => {
  describe("WHEN invalid input is provided", () => {
    it("Then box will turn red and tooltip will display on hover", () => {
      cy.mount(<VuuInputWithValidation />);
      cy.findByTestId("vuu-input").type("hello{enter}");
      cy.findAllByTestId("vuu-input").find(".vuuInput-errorIcon").realHover();
      cy.wait(500);
      cy.findAllByTestId("vuu-input").should("have.class", "vuuInput-error");
      cy.get(".vuuTooltip").should("be.visible");
    });
  });
  describe("WHEN valid input is provided", () => {
    it("Then the box will turn green and no tooltip will be displayed", () => {
      cy.mount(<VuuInputWithValidation />);
      cy.findByTestId("vuu-input").type("012345{enter}");
      cy.findByTestId("vuu-input").should("have.class", "saltInput-success");
      cy.findByRole("img").should("have.class", "saltStatusAdornment-success");
    });
  });
  describe("WHEN no input is provded", () => {
    it("Then the box will not change", () => {
      cy.mount(<VuuInputWithValidation />);
      cy.findByTestId("vuu-input").type("{enter}");
      cy.findByTestId("vuu-input").should("have.class", "saltInput-primary");
    });
  });
  describe("WHEN input provided overflows", () => {
    it("Then box will store the complete value", () => {
      cy.mount(<VuuInputWithValidation />);
      cy.findByTestId("vuu-input").type(
        "01234567890123456789012345678901234567890123456789012345678901234567890{enter}",
      );
      cy.findAllByTestId("vuu-input")
        .find("input.saltInput-input")
        .should(
          "have.value",
          "01234567890123456789012345678901234567890123456789012345678901234567890",
        );
    });
  });
});
