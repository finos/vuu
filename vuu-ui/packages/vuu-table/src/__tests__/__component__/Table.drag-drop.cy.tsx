// TODO try and get TS path alias working to avoid relative paths like this
import { SimulTable } from "../../../../../showcase/src/examples/Table/SIMUL.examples";

//TODO fix this test. mousemove instructions atre not working in upgraded cypress version
describe.skip("Table drag drop", () => {
  const force = true;
  const RENDER_BUFFER = 5;
  const ROW_COUNT = 50;
  const tableConfig = {
    renderBufferSize: RENDER_BUFFER,
    headerHeight: 25,
    height: 625,
    rowCount: ROW_COUNT,
    rowHeight: 20,
    width: 800,
  };
  describe("Drag drop column headers", () => {
    describe("WHEN exchange columns is dragged and dropped on currency", () => {
      it("THEN columns are reordered and grid rerendered", () => {
        cy.mount(<SimulTable tableName="instruments" {...tableConfig} />);

        cy.findByRole("columnheader", { name: "currency" }).should(
          "have.attr",
          "aria-colindex",
          "2",
        );
        cy.findByRole("columnheader", { name: "exchange" }).should(
          "have.attr",
          "aria-colindex",
          "4",
        );

        cy.findByRole("columnheader", { name: "exchange" })
          .trigger("mousedown", { button: 0 })
          .trigger("mousemove", { force, clientX: 150, clientY: 0 })
          .trigger("mousemove", { force, clientX: 100, clientY: 0 })
          .trigger("mouseup", { force });

        cy.findByRole("columnheader", { name: "exchange" }).should(
          "have.attr",
          "aria-colindex",
          "2",
        );
        cy.findByRole("columnheader", { name: "currency" }).should(
          "have.attr",
          "aria-colindex",
          "3",
        );
      });
    });
  });
});
