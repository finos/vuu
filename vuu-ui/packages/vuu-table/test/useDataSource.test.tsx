import type {
  DataSource,
  DataSourceSubscribeCallback,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
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

const rolesConfiguredColumns = [
  "client_id",
  "client_identifier",
  "client_name",
  "role_id",
  "role_name",
];
const rolesSubscribedColumns = [
  "client_id",
  "client_identifier",
  "role_id",
  "role_name",
  "client_name",
];
const rolesTableSchema: TableSchema = {
  columns: rolesSubscribedColumns.map((name) => ({
    name,
    serverDataType: "string",
  })),
  key: "role_id",
  table: { module: "AUTH", table: "roles" },
};
const rolesRow = [
  0,
  0,
  false,
  false,
  0,
  0,
  "roleId",
  false,
  0,
  false,
  "portalInternalId",
  "vuu-portal",
  "roleId",
  "roleName",
  "Basket Trading",
];

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

const createRolesDataSource = () => {
  let columns = rolesConfiguredColumns;
  const dataSource = {
    get columns() {
      return columns;
    },
    isSessionDataSourceOf: vi.fn(() => false),
    on: vi.fn(),
    range: Range(0, 10),
    removeListener: vi.fn(),
    resume: vi.fn(),
    status: "initialising",
    subscribe: vi.fn(
      (_subscribeProps: unknown, callback: DataSourceSubscribeCallback) => {
        columns = rolesSubscribedColumns;
        callback({
          columns,
          tableSchema: rolesTableSchema,
          type: "subscribed",
        } as any);
        callback({
          mode: "batch",
          rows: [rolesRow],
          size: 1,
          type: "viewport-update",
        } as any);
      },
    ),
    suspend: vi.fn(),
    tableSchema: undefined,
  } as unknown as DataSource;

  return dataSource;
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

const RolesFixture = ({
  dataSource,
  onRow,
}: {
  dataSource: DataSource;
  onRow: (row: DataRow) => void;
}) => {
  const { dataRows, setRange } = useDataSource({
    dataSource,
    onSelect: () => undefined,
    onSizeChange: () => undefined,
    onSubscribed: () => undefined,
  });

  useEffect(() => {
    if (dataRows[0]) {
      onRow(dataRows[0]);
    }
  }, [dataRows, onRow]);

  useEffect(() => {
    setRange({ from: 0, to: 1 });
  }, [setRange]);

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
    vi.mocked(session.dataSource.isSessionDataSourceOf!).mockImplementation(
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

  it("maps Roles rows from the subscribed response columns through the hook lifecycle", async () => {
    const dataSource = createRolesDataSource();
    const onRow = vi.fn();

    await act(async () =>
      root.render(
        <RolesFixture dataSource={dataSource} onRow={onRow} />,
      ),
    );

    expect(dataSource.subscribe).toHaveBeenCalled();
    expect(onRow).toHaveBeenCalled();

    const dataRow = onRow.mock.calls.at(-1)?.[0];
    expect(dataRow.client_identifier).toEqual("vuu-portal");
    expect(dataRow.client_name).toEqual("Basket Trading");
  });
});
