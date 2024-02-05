// TODO try and get TS path alias working to avoid relative paths like this
import { TestTable } from "../../../../../showcase/src/examples/Table/Table.examples";
import { TwoHundredColumns } from "../../../../../showcase/src/examples/Table/TEST.examples";
import {
  assertRenderedColumns,
  assertRenderedRows,
  withAriaIndex,
} from "./table-test-utils";

describe("Table drag drop", () => {
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
  describe("Drag drop column headers", () => {});
});
