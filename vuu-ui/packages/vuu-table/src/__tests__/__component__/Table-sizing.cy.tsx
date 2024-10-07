import React from "react";
// TODO try and get TS path alias working to avoid relative paths like this
import {
  ViewportRowLimitDefaultRowHeight,
  ViewportRowLimitExplicitRowHeight,
  MaxViewportRowLimitRowsExceedLimit,
  MaxViewportRowLimitFewRows,
} from "../../../../../showcase/src/examples/Table/TableLayout.examples";
import { assertRenderedRows } from "./table-test-utils";

describe("viewportRowLimit", () => {
  describe("WHEN rendered with default rowHeight", () => {
    it("THEN expected classname is present and all dimensions are correct", () => {
      cy.mount(<ViewportRowLimitDefaultRowHeight />);
      const container = cy.findByTestId("table");
      container.should("have.class", "vuuTable-viewportRowLimit");
      cy.findByTestId("table").should((el) => expect(el.height()).eq(235));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(225),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(210),
      );
    });
  });

  describe("WHEN rendered with explicit rowHeight", () => {
    it("THEN expected classname is present", () => {
      cy.mount(<ViewportRowLimitExplicitRowHeight />);
      cy.findByTestId("table").should((el) => expect(el.height()).eq(335));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(325),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(310),
      );
    });
  });
});

describe("maxViewportRowLimit", () => {
  describe("WHEN rendered with more rows than viewport can accommodate", () => {
    it("THEN height is based on rows rendered", () => {
      cy.mount(<MaxViewportRowLimitRowsExceedLimit />);
      const container = cy.findByTestId("table");
      container.should("have.class", "vuuTable-maxViewportRowLimit");
      cy.findByTestId("table").should((el) => expect(el.height()).eq(235));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(225),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(210),
      );
    });
  });

  describe("WHEN rendered with not enough rows to fill viewport, no horizontal scrollbar", () => {
    it("THEN height id reduced to just accommodate visible rows", () => {
      cy.mount(<MaxViewportRowLimitFewRows />);
      cy.findByTestId("table").should((el) => expect(el.height()).eq(105));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(105),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(80),
      );
    });
  });
  describe("WHEN rendered with not enough rows to fill viewport, with horizontal scrollbar", () => {
    it("THEN height id reduced to just accommodate visible rows", () => {
      cy.mount(<MaxViewportRowLimitFewRows width={300} />);
      cy.findByTestId("table").should((el) => expect(el.height()).eq(115));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(105),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(90),
      );
    });
  });
});
