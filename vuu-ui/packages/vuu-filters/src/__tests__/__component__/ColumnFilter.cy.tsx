import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import {
  TextColumnFilterValueSetViaBtn,
  NumericColumnFilterValueWithBetweenOp,
  TimeColumnRangeFilter,
} from "../../../../../showcase/src/examples/Filters/ColumnFilter.examples";

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

  describe("WHEN numeric columnfilter is rendered", () => {
    beforeEach(() => {
      cy.mount(
        <LocalDataSourceProvider>
          <NumericColumnFilterValueWithBetweenOp />
        </LocalDataSourceProvider>,
      );
    });

    it("THEN the component is rendered with an initial value", () => {
      const container = cy.findByTestId("columnfilter");
      container.should("have.class", "vuuColumnFilter");
      container.find("input").as("inputs");
      cy.get("@inputs").should("have.length", 2);
      cy.get("@inputs").eq(0).should("have.value", "35");
      cy.get("@inputs").eq(1).should("have.value", "45.3");
    });

    it("THEN component renders a new value provided via state set from outside the container", () => {
      const container = cy.findByTestId("columnfilter");
      container.find("input").as("inputs");
      cy.get("@inputs").should("have.length", 2);
      cy.contains("button", "[10.96, 20.12]").realClick();
      cy.get("@inputs").eq(0).should("have.value", "10.96");
      cy.get("@inputs").eq(1).should("have.value", "20.12");
      cy.contains("button", "[100, 200]").realClick();
      cy.get("@inputs").eq(0).should("have.value", "100");
      cy.get("@inputs").eq(1).should("have.value", "200");
    });
  });

  describe("WHEN handleColumnFilterChange event for range edit controls are triggered", () => {
    it("should trigger handleColumnFilterChange with correct parameters when time range input changes", () => {
      const handleColumnFilterChange = cy.stub().as("handleColumnFilterChange");
      cy.mount(
        <TimeColumnRangeFilter
          onColumnFilterChange={handleColumnFilterChange}
        />,
      );

      cy.findByTestId("columnfilter").find("input").as("inputs");

      cy.get("@inputs").eq(0).should("have.value", "00:00:00");
      cy.get("@inputs").eq(1).should("have.value", "00:01:02");

      cy.get("@inputs")
        .eq(0)
        .realPress("ArrowUp")
        .realPress("Tab")
        .realPress("ArrowUp");

      cy.get("@handleColumnFilterChange").should(
        "have.been.calledWith",
        ["01:00:00", "00:01:02"],
        { name: "lastUpdate", serverDataType: "long", type: "time" },
        "between",
      );
    });
  });
});
