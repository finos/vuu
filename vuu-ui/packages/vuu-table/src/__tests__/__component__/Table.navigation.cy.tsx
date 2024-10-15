import { should } from "chai";
import { TabInAndOut } from "../../../../../showcase/src/examples/Table/Table.examples";

describe("Cell navigation with keyboard", () => {
  describe("navigation from outside with Tab", () => {
    it("begins navigation in first header cell", () => {
      cy.mount(<TabInAndOut />);
      const inputStart = cy.findByTestId("input-start");
      inputStart.realClick();
      cy.realPress("Tab");
      cy.findAllByRole("columnheader").eq(0).should("be.focused");
    });
  });
});
