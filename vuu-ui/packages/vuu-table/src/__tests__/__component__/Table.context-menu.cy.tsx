import { LocalContextMenu } from "../../../../../showcase/src/examples/Table/ContextMenu.examples";
import { ParentOrders } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

describe("WHEN context menu is configured on table", () => {
  describe("WHEN cell is right clicked", () => {
    it("THEN context menu is displayed", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <LocalContextMenu />
        </LocalDataSourceProvider>,
      );
      cy.findByRole("cell", { name: "AAOP N" }).realClick({ button: "right" });
      cy.findByRole("menu").should("be.visible");
      cy.realPress("Escape");
      cy.findByRole("menu").should("not.exist");
    });

    it("THEN clicked cell has correct css classname", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <LocalContextMenu />
        </LocalDataSourceProvider>,
      );
      const cell = cy.findByRole("cell", { name: "AAOP N" });
      cell.realClick({ button: "right" });
      cell.should("have.class", "ContextOpen");
      cy.realPress("Escape");
      cell.should("not.have.class", "ContextOpen");
    });
  });
});

describe("WHEN no context menu is configured on table", () => {
  describe("WHEN cell is right clicked", () => {
    it("THEN no context menu is displayed", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <ParentOrders />
        </LocalDataSourceProvider>,
      );
      cy.findAllByRole("cell", { name: "GBP" }).eq(0).realClick({
        button: "right",
      });
      cy.findByRole("menu").should("not.exist");
    });

    it("THEN clicked cell has no context menu classname", () => {
      cy.mount(
        <LocalDataSourceProvider>
          <ParentOrders />
        </LocalDataSourceProvider>,
      );
      const cell = cy.findAllByRole("cell", { name: "GBP" }).eq(0);
      cell.realClick({ button: "right" });
      cell.should("not.have.class", "ContextOpen");
    });
  });
});
