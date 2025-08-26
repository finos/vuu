import { TestTimeInput } from "../../../../../../showcase/src/examples/UiControls/TimeInput.examples";

describe("TimeInput", () => {
  describe("WHEN uncontrolled", () => {
    describe("AND passed no defaultValue", () => {
      it("renders as expected, placeholder shows, value is empty", () => {
        cy.mount(<TestTimeInput />);
        cy.wait(30);
        const timeinput = cy.findByTestId("timeinput");
        timeinput.should("have.class", "vuuTimeInput");
        timeinput.should("have.value", "");
      });
    });
    describe("AND passed defaultValue", () => {
      it("renders as expected, value is visible, value is as expected", () => {
        cy.mount(<TestTimeInput defaultValue="00:00:00" />);
        cy.wait(30);
        const timeinput = cy.findByTestId("timeinput");
        timeinput.should("have.class", "vuuTimeInput");
        timeinput.should("have.value", "00:00:00");
      });
    });
  });

  describe("focus management", () => {
    describe("WHEN focus enters control via keyboard, forwards", () => {
      it("THEN control is focused and hours are selected", () => {
        cy.mount(<TestTimeInput defaultValue="00:00:00" />);
        cy.findByTestId("pre-timeinput").find("input").focus();
        cy.realPress("Tab");
        cy.findByTestId("timeinput").should("be.focused");
      });
    });
  });
});
