import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useTableModel } from "../src/useTableModel";

// creates a Worker on import, not needed here
vi.mock("@vuu-ui/vuu-data-remote", () => ({ ConnectionManager: {} }));

const tableSchema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "nanoTimestamp", serverDataType: "epochtimestampnano" },
  ],
  key: "id",
  table: { module: "TEST", table: "test" },
};

// A remote dataSource has no tableSchema until subscribed
const dataSource = {
  config: {
    columns: ["id", "nanoTimestamp"],
    filterSpec: { filter: "" },
    groupBy: [],
    sort: { sortDefs: [] },
  },
  tableSchema: undefined,
} as unknown as DataSource;

let model: ReturnType<typeof useTableModel>;

const Fixture = () => {
  model = useTableModel({
    availableWidth: 500,
    config: {
      columns: [
        { name: "id" },
        {
          name: "nanoTimestamp",
          type: {
            name: "date/time",
            formatting: { pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" } },
          },
        },
      ],
    },
    dataSource,
  });
  return null;
};

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = false;
});

describe("useTableModel setTableSchema", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("rebuilds valueFormatter when serverDataType is applied from schema", () => {
    act(() => root.render(<Fixture />));
    act(() =>
      model.dispatchTableModelAction({ type: "setTableSchema", tableSchema }),
    );
    const column = model.columns.find((c) => c.name === "nanoTimestamp")!;
    expect(column.serverDataType).toEqual("epochtimestampnano");
    expect(column.valueFormatter("1790722800123456789")).toMatch(
      /^2026-09-\d{2} \d{2}:\d{2}:\d{2}\.123456789$/,
    );
  });
});
