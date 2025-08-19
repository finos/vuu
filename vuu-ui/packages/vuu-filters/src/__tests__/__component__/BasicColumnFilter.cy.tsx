import {
  DefaultBasicColumnPicker,
  BasicColumnPickerWithInitialValue,
  BasicColumnPickerWithoutStartAdornment,
} from "../../../../../showcase/src/examples/Filters/BasicColumnFilter/BasicColumnFilter.examples";

describe("BasicColumnFilter", () => {
  describe("WHEN basic column filter is rendered", () => {
    it("THEN expected classname is present along with the startadornment as search icon", () => {
      cy.mount(<DefaultBasicColumnPicker />);
      const container = cy.findByTestId("basiccolumnfilter");
      container.should("have.class", "vuuBasicColumnFilter");
      container
        .find(".vuuIcon")
        .should("exist")
        .and("have.attr", "data-icon", "search");
    });

    it("THEN the component shows suggestions on input", () => {
      cy.mount(<DefaultBasicColumnPicker />);
      const container = cy.findByTestId("basiccolumnfilter");
      container.find("input").type("A");
      cy.findAllByRole("option", { name: "AAOO.L" }).should("be.visible");
    });

    it("THEN the component is rendered with the provided initial value", () => {
      cy.mount(<BasicColumnPickerWithInitialValue />);
      const container = cy.findByTestId("basiccolumnfilter");
      container.find("input").should("be.focused").and("have.value", "AAOO.L");
    });

    it("THEN component is rendered without startadornment search icon", () => {
      cy.mount(<BasicColumnPickerWithoutStartAdornment />);
      const container = cy.findByTestId("basiccolumnfilter");
      container.find(".vuuIcon").should("not.exist");
    });
  });
});
