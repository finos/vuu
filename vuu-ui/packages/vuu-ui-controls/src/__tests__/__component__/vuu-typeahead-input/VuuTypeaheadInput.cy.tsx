import {
  CurrencyWithTypeaheadAllowFreeText,
  CurrencyWithTypeaheadDisallowFreeText,
} from "../../../../../../showcase/src/examples/UiControls/VuuTypeaheadInput.examples";

describe("VuuTypeaheadInput", () => {
  describe("Given a TypeaheadInput that shows currency suggestions and allows free text", () => {
    describe("Then a matched input pattern will show currency suggestions", () => {
      it("first of which which can be selected to commit by pressing Enter", () => {
        const onCommit = cy.stub().as("onCommit");
        cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
        cy.findByRole("combobox").type("G");
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("option").should("have.length", 2);
        cy.findAllByRole("option")
          .eq(0)
          .should("have.class", "saltOption-active");
        cy.findAllByRole("option")
          .eq(0)
          .should("have.class", "saltOption-focusVisible");
        cy.realPress("Enter");
        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "keydown" },
          "GBP",
        );
        cy.findByRole("listbox").should("not.exist");
      });
      it("any of which which can be selected (and committed) by clicking", () => {
        const onCommit = cy.stub().as("onCommit");
        cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
        cy.findByRole("combobox").type("G");
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("option").should("have.length", 2);
        cy.findAllByRole("option").eq(1).click();
        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "click" },
          "GBX",
        );
        cy.findByRole("listbox").should("not.exist");
      });
      it("which can be navigated with Arrow key", () => {
        const onCommit = cy.stub().as("onCommit");
        cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
        cy.findByRole("combobox").type("G");
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("option").should("have.length", 2);
        cy.findAllByRole("option")
          .eq(0)
          .should("have.class", "saltOption-active");
        cy.findAllByRole("option")
          .eq(0)
          .should("have.class", "saltOption-focusVisible");
        cy.realPress("ArrowDown");
        cy.realPress("Enter");
        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "keydown" },
          "GBX",
        );
        cy.findByRole("listbox").should("not.exist");
      });
      it("a complete match will always show one suggestion, Enter commits", () => {
        const onCommit = cy.stub().as("onCommit");
        cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
        cy.findByRole("combobox").type("GBP");
        cy.findByRole("listbox").should("be.visible");
        cy.findAllByRole("option").should("have.length", 1);
        cy.findAllByRole("option")
          .eq(0)
          .should("have.class", "saltOption-active");
        cy.findAllByRole("option")
          .eq(0)
          .should("have.class", "saltOption-focusVisible");
        cy.realPress("Enter");
        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "keydown" },
          "GBP",
        );
        cy.findByRole("listbox").should("not.exist");
      });
    });

    describe("Then a non-matched input pattern will show no suggestions", () => {
      it("and any text can be committed", () => {
        const onCommit = cy.stub().as("onCommit");
        cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
        cy.findByRole("combobox").type("abc");

        cy.findAllByRole("option").should("have.length", 1);
        cy.findAllByRole("option")
          .eq(0)
          .should("have.attr", "aria-disabled", "true");
        cy.findAllByRole("option")
          .eq(0)
          .should("have.text", "No matching data");

        cy.realPress("Enter");
        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "keydown" },
          "abc",
        );
      });
      it("then clearing previously committed text will automatically commit", () => {
        const onCommit = cy.stub().as("onCommit");
        cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
        cy.findByRole("combobox").type("abc");
        cy.realPress("Enter");
        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "keydown" },
          "abc",
        );
        cy.realPress("Backspace");
        cy.realPress("Backspace");
        cy.realPress("Backspace");

        cy.get("@onCommit").should(
          "be.calledWithMatch",
          { type: "keydown" },
          "",
        );
      });
    });
  });

  describe("Given a TypeaheadInput that shows currency suggestions and DISALLOWS free text", () => {
    it("Then a non-matched input pattern will show no suggestions", () => {
      const onCommit = cy.stub().as("onCommit");
      cy.mount(<CurrencyWithTypeaheadAllowFreeText onCommit={onCommit} />);
      cy.findByRole("combobox").type("abc");

      cy.findAllByRole("option").should("have.length", 1);
      cy.findAllByRole("option")
        .eq(0)
        .should("have.attr", "aria-disabled", "true");
      cy.findAllByRole("option").eq(0).should("have.text", "No matching data");

      cy.realPress("Enter");
      cy.get("@onCommit").should(
        "be.calledWithMatch",
        { type: "keydown" },
        "abc",
      );
    });
    it("Then commit will not be allowed when input text matches no suggestions", () => {
      const onCommit = cy.stub().as("onCommit");
      cy.mount(<CurrencyWithTypeaheadDisallowFreeText onCommit={onCommit} />);
      cy.findByRole("combobox").type("abc");
      cy.realPress("Enter");
      cy.get("@onCommit").should("not.be.called");
    });

    it("Then warning will be shown if commit attempted on non matching text", () => {
      const onCommit = cy.stub().as("onCommit");
      cy.mount(<CurrencyWithTypeaheadDisallowFreeText onCommit={onCommit} />);
      cy.findByRole("combobox").type("abc");
      cy.realPress("Enter");

      cy.findAllByRole("option").should("have.length", 1);
      cy.findAllByRole("option")
        .eq(0)
        .should("have.attr", "aria-disabled", "true");
      cy.wait(200);
      cy.findAllByRole("option")
        .eq(0)
        .invoke("text")
        .should(
          "contain",
          "Please select a value from the list of suggestions",
        );
    });
  });
});
