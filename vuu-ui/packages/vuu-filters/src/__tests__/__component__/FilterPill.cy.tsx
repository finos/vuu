import {
  FilterPillNotEditable,
  FilterPillEditableLabel,
} from "../../../../../showcase/src/examples/Filters/FilterBar/FilterPill.examples";

describe("FilterPill", () => {
  describe("WHEN Non editable", () => {
    it("THEN no rename menu option is offered", () => {
      cy.mount(<FilterPillNotEditable />);
      cy.findByRole("button", { name: "currency" }).realClick();
      cy.realPress("ArrowDown");
      cy.findByRole("menu").should("be.visible");
      cy.findByRole("menitemu", { name: "Rename" }).should("not.exist");
    });
    it("THEN no EditableLabel is rendered", () => {
      cy.mount(<FilterPillNotEditable />);
      cy.get(".vuuEditableLabel").should("not.exist");
    });
  });
  describe("Label editing", () => {
    describe("WHEN initially rendered", () => {
      it("THEN  Rename menu option is offered", () => {
        cy.mount(<FilterPillEditableLabel />);
        cy.findByRole("button", { name: "currency" }).realClick();
        cy.realPress("ArrowDown");
        cy.findByRole("menu").should("be.visible");
        cy.findByRole("menuitem", { name: "Rename" }).should("be.visible");
      });
      it("THEN EditableLabel is rendered", () => {
        cy.mount(<FilterPillEditableLabel />);
        cy.get(".vuuEditableLabel").should("exist");
      });
    });
    //     describe("WHEN editing prop is changed to true");
    //     describe("WHEN edit is cancelled");
    //     describe("WHEN edit is committed");
    //     describe("WHEN edit is initiated from menu");
  });
  //   describe("Focus management", () => {
  //     describe("WHEN focus received via keyboard");
  //     describe("WHEN focus received via mouse click");
  //   });
  //   describe("Toggle behaviour", () => {
  //     describe("WHEN clicked via keyboard");
  //     describe("WHEN clicked with mouse");
  //   });
});
