import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { Range } from "@vuu-ui/vuu-utils";
import { act, useEffect } from "react";
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
import { useDataSource } from "../src/table-data-source/useDataSource";

const tableSchema: TableSchema = {
  columns: [{ name: "id", serverDataType: "string" }],
  key: "id",
  table: { module: "TEST", table: "test" },
};

const createDataSource = () => {
  const resolvedSuspensions: boolean[] = [];
  const dataSource = {
    columns: ["id"],
    isSessionDataSourceOf: vi.fn(() => false),
    on: vi.fn(),
    range: Range(0, 10),
    removeListener: vi.fn(),
    resume: vi.fn(),
    status: "subscribed",
    suspend: vi.fn((escalateToDisable = true) => {
      resolvedSuspensions.push(escalateToDisable);
    }),
    tableSchema,
  } as unknown as DataSource;

  return { dataSource, resolvedSuspensions };
};

const sessionTableSchema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "vuuMsg", serverDataType: "string" },
    { name: "vuu_action", serverDataType: "string" },
  ],
  key: "id",
  table: { module: "TEST", table: "session" },
};

const Fixture = ({ dataSource }: { dataSource: DataSource }) => {
  useDataSource({
    dataSource,
    onSelect: vi.fn(),
    onSizeChange: vi.fn(),
    onSubscribed: vi.fn(),
  });
  return null;
};

const SessionRowsFixture = ({
  dataSource,
  onRows,
}: {
  dataSource: DataSource;
  onRows: (rows: ReturnType<typeof useDataSource>["dataRows"]) => void;
}) => {
  const { dataRows, setRange } = useDataSource({
    dataSource,
    onSelect: vi.fn(),
    onSizeChange: vi.fn(),
    onSubscribed: vi.fn(),
  });

  useEffect(() => {
    setRange({ from: 0, to: 1 });
  }, [setRange]);

  useEffect(() => {
    onRows(dataRows);
  }, [dataRows, onRows]);

  return null;
};

beforeAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = false;
});

describe("useDataSource replacement suspension", () => {
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

  it("does not escalate suspension when switching to the source's session datasource", async () => {
    const source = createDataSource();
    const session = createDataSource();
    const isSessionDataSourceOf = session.dataSource.isSessionDataSourceOf;
    if (isSessionDataSourceOf === undefined) {
      throw Error(
        "Test session datasource must identify its source datasource.",
      );
    }
    vi.mocked(isSessionDataSourceOf).mockImplementation(
      (dataSource) => dataSource === source.dataSource,
    );

    await act(async () =>
      root.render(<Fixture dataSource={source.dataSource} />),
    );
    await act(async () =>
      root.render(<Fixture dataSource={session.dataSource} />),
    );

    expect(source.dataSource.suspend).toHaveBeenCalledWith(false, undefined);
    expect(source.resolvedSuspensions).toEqual([false]);
  });

  it("preserves normal escalating suspension for ordinary replacements", async () => {
    const source = createDataSource();
    const replacement = createDataSource();

    await act(async () =>
      root.render(<Fixture dataSource={source.dataSource} />),
    );
    await act(async () =>
      root.render(<Fixture dataSource={replacement.dataSource} />),
    );

    expect(source.dataSource.suspend).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
    expect(source.resolvedSuspensions).toEqual([true]);
  });

  it("waits for the session schema before creating DataRows from early updates", async () => {
    let callback: Parameters<NonNullable<DataSource["subscribe"]>>[1];
    let rows: ReturnType<typeof useDataSource>["dataRows"] = [];
    const earlySessionDataSource = {
      columns: ["id", "vuuMsg", "vuu_action"],
      on: vi.fn(),
      range: Range(0, 1),
      removeListener: vi.fn(),
      status: "initialising",
      subscribe: vi.fn((_props, nextCallback) => {
        callback = nextCallback;
        callback({
          rows: [
            [
              0,
              0,
              false,
              false,
              0,
              0,
              "row-1",
              false,
              0,
              false,
              "row-1",
              "",
              "addRow",
            ],
          ],
          size: 1,
          type: "viewport-update",
        });
        callback({
          columns: ["id", "vuuMsg", "vuu_action"],
          tableSchema: sessionTableSchema,
          type: "subscribed",
        });
      }),
      suspend: vi.fn(),
    } as unknown as DataSource;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await act(async () =>
      root.render(
        <SessionRowsFixture
          dataSource={earlySessionDataSource}
          onRows={(nextRows) => {
            rows = nextRows;
          }}
        />,
      ),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].vuu_action).toBe("addRow");
    expect(warn).not.toHaveBeenCalled();
  });
});
