import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { Range } from "@vuu-ui/vuu-utils";
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

const Fixture = ({ dataSource }: { dataSource: DataSource }) => {
  useDataSource({
    columns: [],
    dataSource,
    onSelect: vi.fn(),
    onSizeChange: vi.fn(),
    onSubscribed: vi.fn(),
  });
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
});
