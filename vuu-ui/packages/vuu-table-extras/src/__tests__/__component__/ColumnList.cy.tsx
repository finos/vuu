import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import {
  DefaultColumnList,
  ManyColumnList,
  ManyColumnListWithSearch,
  ManyColumnListRemoveOnly,
} from "../../../../../showcase/src/examples/TableExtras/TableSettings.examples";

describe("ColumnList", () => {
  describe("DefaultColumnList", () => {
    it("THEN expected list is rendered", () => {
      cy.mount(<DefaultColumnList />);
      cy.findByRole("listbox").should("be.visible");
    });
  });
  describe("ColumnList with 200+ columns", () => {
    it("THEN expected list is rendered", () => {
      cy.mount(<ManyColumnList />);
      cy.findByRole("listbox").should("be.visible");
    });

    describe("WHEN configured wuth removeOnly", () => {
      it("THEN expected list is rendered", () => {
        cy.mount(<ManyColumnListRemoveOnly />);
        cy.findByRole("listbox").should("be.visible");
      });
    });
  });
  describe("ColumnList with 200+ columns, with search", () => {
    it("THEN expected list is rendered", () => {
      cy.mount(<ManyColumnListWithSearch />);
      cy.findByRole("search").should("be.visible");
      cy.findByRole("listbox").should("be.visible");
    });
  });
});
