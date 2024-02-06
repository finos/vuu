// TODO try and get TS path alias working to avoid relative paths like this
import { TestTable } from "../../../../../showcase/src/examples/Table/Table.examples";
import { TwoHundredColumns } from "../../../../../showcase/src/examples/Table/TEST.examples";
import {
  assertRenderedColumns,
  assertRenderedRows,
  withAriaRowIndex,
} from "./table-test-utils";

describe("Table scrolling and keyboard navigation", () => {
  const RENDER_BUFFER = 5;
  const ROW_COUNT = 1000;
  const tableConfig = {
    renderBufferSize: RENDER_BUFFER,
    headerHeight: 25,
    height: 625,
    rowCount: ROW_COUNT,
    rowHeight: 20,
    width: 1000,
  };
  describe("Page Keys", () => {
    describe("WHEN first cell is focussed and page down pressed", () => {
      it("THEN table scrolls down and next page of rows are rendered, first cell of new page is focussed", () => {
        cy.mount(<TestTable {...tableConfig} />);

        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 1" }).click();
        cy.findByRole("cell", { name: "row 1" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 1" }).should("be.focused");
        cy.realPress("PageDown");

        cy.findByRole("row", withAriaRowIndex(25)).should("not.exist");
        cy.findByRole("row", withAriaRowIndex(26)).should("exist");

        cy.get(".vuuTable-contentContainer")
          .then((el) => el[0].scrollTop)
          .should("equal", 600);

        // row 31 should be top row in viewport
        cy.findByRole("row", withAriaRowIndex(31)).should(
          "have.css",
          "transform",
          "matrix(1, 0, 0, 1, 0, 600)"
        );

        cy.findByRole("cell", { name: "row 31" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 31" }).should("be.focused");
      });

      describe("AND WHEN page up is then pressed", () => {
        it("THEN table is back to original state, and first cell is once again focussed", () => {
          cy.mount(<TestTable {...tableConfig} />);

          // interestingly, realClick doesn't work here
          cy.findByRole("cell", { name: "row 1" }).click();

          cy.realPress("PageDown");
          cy.wait(60);
          cy.realPress("PageUp");

          cy.findByRole("cell", { name: "row 1" }).should(
            "have.attr",
            "tabindex",
            "0"
          );
          cy.findByRole("cell", { name: "row 1" }).should("be.focused");

          assertRenderedRows({ from: 0, to: 30 }, RENDER_BUFFER, ROW_COUNT);
        });
      });
    });
  });

  describe("Home / End Keys", () => {
    describe("WHEN topmost rows are in viewport, first cell is focussed and Home key pressed ", () => {
      it("THEN nothing changes", () => {
        cy.mount(<TestTable {...tableConfig} />);
        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 1" }).click();
        cy.realPress("Home");
        cy.findByRole("cell", { name: "row 1" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 1" }).should("be.focused");
        assertRenderedRows({ from: 0, to: 30 }, RENDER_BUFFER, ROW_COUNT);
      });
    });
    describe("WHEN topmost rows are in viewport, cell in middle of viewport is focussed and Home key pressed ", () => {
      it("THEN no scrolling, but focus moves to first cell", () => {
        cy.mount(<TestTable {...tableConfig} />);
        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 5" }).click();
        cy.realPress("Home");
        cy.findByRole("cell", { name: "row 1" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 1" }).should("be.focused");
        assertRenderedRows({ from: 0, to: 30 }, RENDER_BUFFER, ROW_COUNT);
      });
    });

    describe("WHEN topmost rows are in viewport, first cell is focussed and End key pressed ", () => {
      it("THEN scrolls to end of data, last cell is focussed (same column)", () => {
        cy.mount(<TestTable {...tableConfig} />);
        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 1" }).click();
        cy.realPress("End");
        cy.findByRole("cell", { name: "row 1,000" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 1,000" }).should("be.focused");
        assertRenderedRows({ from: 970, to: 1000 }, RENDER_BUFFER, ROW_COUNT);
      });
    });

    describe("WHEN topmost rows are in viewport, cell mid viewport focussed and End key pressed ", () => {
      it("THEN scrolls to end of data, last cell is focussed (same column)", () => {
        cy.mount(<TestTable {...tableConfig} />);
        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 10" }).click();
        cy.realPress("End");
        cy.findByRole("cell", { name: "row 1,000" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 1,000" }).should("be.focused");
        assertRenderedRows({ from: 970, to: 1000 }, RENDER_BUFFER, ROW_COUNT);
      });
    });
  });

  describe("Arrow Up / Down Keys", () => {
    describe("WHEN topmost rows are in viewport, first cell is focussed and Down Arrow key pressed ", () => {
      it("THEN no scrolling, focus moved down to next cell", () => {
        cy.mount(<TestTable {...tableConfig} />);
        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 1" }).click();
        cy.realPress("ArrowDown");
        cy.findByRole("cell", { name: "row 2" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 2" }).should("be.focused");
        assertRenderedRows({ from: 0, to: 30 }, RENDER_BUFFER, ROW_COUNT);
      });
    });
    describe("WHEN topmost rows are in viewport, first cell in last row is focussed and Down Arrow key pressed ", () => {
      it("THEN scroll down by 1 row, cell in bottom row has focus", () => {
        cy.mount(<TestTable {...tableConfig} />);
        // interestingly, realClick doesn't work here
        cy.findByRole("cell", { name: "row 30" }).click();
        cy.realPress("ArrowDown");
        cy.findByRole("cell", { name: "row 31" }).should(
          "have.attr",
          "tabindex",
          "0"
        );
        cy.findByRole("cell", { name: "row 31" }).should("be.focused");
        assertRenderedRows({ from: 1, to: 31 }, RENDER_BUFFER, ROW_COUNT);
      });
    });
  });

  describe("scrolling with Scrollbar", () => {
    describe("WHEN scrolled down by a distance equating to 500 rows", () => {
      it("THEN correct rows are within viewport", () => {
        cy.mount(<TestTable {...tableConfig} />);
        cy.get(".vuuTable-scrollbarContainer").scrollTo(0, 10000);
        assertRenderedRows({ from: 500, to: 530 }, RENDER_BUFFER, ROW_COUNT);
      });
    });
  });

  describe("horizontal virtualization", () => {
    describe("WHEN table has many columns", () => {
      it("THEN only those columns within the viewport are rendered", () => {
        // this width allows for exactly 6 visible columns, we allow a buffer of 200px
        // so 2 out-of-viewport colums are rendered
        cy.mount(<TwoHundredColumns width={915} />);
        assertRenderedColumns({
          rendered: { from: 1, to: 8 },
          visible: { from: 1, to: 6 },
        });
      });
    });

    describe("WHEN table is scrolled horizontally no more than 100px", () => {
      it("THEN rendering is unchanged", () => {
        cy.mount(<TwoHundredColumns width={915} />);
        cy.get(".vuuTable-scrollbarContainer").scrollTo(100, 0);
        assertRenderedColumns({
          rendered: { from: 1, to: 8 },
          visible: { from: 1, to: 6 },
        });
      });
    });

    describe("WHEN table is scrolled beyond the 100px buffer", () => {
      it("THEN additional column(s) are rendered", () => {
        cy.mount(<TwoHundredColumns width={915} />);
        cy.get(".vuuTable-scrollbarContainer").scrollTo(110, 0);
        assertRenderedColumns({
          rendered: { from: 1, to: 9 },
          // the leading edge of column 7 is visible because of space we leave for scrollbar
          visible: { from: 1, to: 7 },
        });
      });
    });

    describe("WHEN table is scrolled exactly one viewport width", () => {
      it("THEN next set of columns are rendered", () => {
        cy.mount(<TwoHundredColumns width={915} />);
        cy.get(".vuuTable-scrollbarContainer").scrollTo(900, 0);
        assertRenderedColumns({
          rendered: { from: 6, to: 14 },
          visible: { from: 7, to: 12 },
        });
      });
    });
  });
});
