import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { TextColumnFilterValueSetViaBtn } from "../../../../../showcase/src/examples/Filters/ColumnFilter.examples";

describe("ColumnFilter", () => {
  describe("WHEN text columnfilter is rendered", () => {
    beforeEach(() => {
      cy.mount(
        <LocalDataSourceProvider>
          <TextColumnFilterValueSetViaBtn />
        </LocalDataSourceProvider>,
      );
    });

    it("THEN the component is rendered with an initial value", () => {
      const container = cy.findByTestId("columnfilter");
      container.should("have.class", "vuuColumnFilter");
      container.find("input").should("have.value", "AAOP.N");
    });

    it("THEN the component shows suggestions on input", () => {
      const container = cy.findByTestId("columnfilter");
      container.find("input").clear().type("A");
      cy.findAllByRole("option", { name: "AAOO.L" }).should("be.visible");
    });

    it("THEN component renders a new value provided via state set from outside the container", () => {
      const container = cy.findByTestId("columnfilter");
      const input = container.find("input");
      input.should("have.value", "AAOP.N");
      cy.contains("button", "AAOQ.OQ").realClick();
      input.should("have.value", "AAOQ.OQ");
      cy.contains("button", "AAOU.MI").realClick();
      input.should("have.value", "AAOU.MI");
    });
  });
});
