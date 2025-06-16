// TODO try and get TS path alias working to avoid relative paths like this
import { Instruments } from "../../../../../showcase/src/examples/Table/Modules/SIMUL.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { TableProps } from "../../Table";

//TODO fix this test. mousemove instructions atre not working in upgraded cypress version
describe("Table drag drop", () => {
  const force = true;
  const RENDER_BUFFER = 5;
  const ROW_COUNT = 50;
  const tableConfig: Partial<TableProps> = {
    renderBufferSize: RENDER_BUFFER,
    height: 625,
    rowHeight: 20,
    width: 800,
  };
  describe("Drag drop column headers", () => {
    describe("WHEN exchange columns is dragged and dropped on currency", () => {
      it("THEN columns are reordered and grid rerendered", () => {
        cy.mount(
          <LocalDataSourceProvider>
            <Instruments {...tableConfig} />
          </LocalDataSourceProvider>,
        );

        cy.findByRole("columnheader", {
          name: "currency column header",
        }).should("have.attr", "aria-colindex", "2");
        cy.findByRole("columnheader", {
          name: "exchange column header",
        }).should("have.attr", "aria-colindex", "4");
        cy.findByRole("columnheader", {
          name: "exchange column header",
        }).realMouseDown({
          button: "left",
          position: "center",
        });

        // cy.findByRole("columnheader", { name: "exchange" })
        //   .trigger("mousedown", { button: 0 })
        //   .trigger("mousemove", { force, clientX: 150, clientY: 0 })
        //   .trigger("mousemove", { force, clientX: 100, clientY: 0 })
        //   .trigger("mouseup", { force });

        // cy.findByRole("columnheader", { name: "exchange" }).should(
        //   "have.attr",
        //   "aria-colindex",
        //   "2",
        // );
        // cy.findByRole("columnheader", { name: "currency" }).should(
        //   "have.attr",
        //   "aria-colindex",
        //   "3",
        // );
      });
    });
  });
});
