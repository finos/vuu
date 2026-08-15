import type {
  DataSource,
  DataSourceStatus,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
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
import { useEditableTable } from "../src";

const tableSchema: TableSchema = {
  columns: [{ name: "id", serverDataType: "string" }],
  key: "id",
  table: { module: "TEST", table: "test" },
};

type TestDataSource = DataSource & {
  listenerCount: (event: string) => number;
  setSubscribed: () => void;
};

const createDataSource = (
  status: DataSourceStatus = "initialising",
): TestDataSource => {
  const listeners = new Map<string, Set<() => void>>();
  const dataSource = {
    columns: ["id"],
    config: { columns: ["id"] },
    endEditSession: vi.fn(),
    on: vi.fn((event: string, listener: () => void) => {
      const eventListeners = listeners.get(event) ?? new Set();
      eventListeners.add(listener);
      listeners.set(event, eventListeners);
    }),
    removeListener: vi.fn((event: string, listener: () => void) => {
      listeners.get(event)?.delete(listener);
    }),
    status,
    tableSchema: status === "subscribed" ? tableSchema : undefined,
  } as unknown as TestDataSource;

  dataSource.listenerCount = (event) => listeners.get(event)?.size ?? 0;
  dataSource.setSubscribed = () => {
    dataSource.status = "subscribed";
    Object.defineProperty(dataSource, "tableSchema", {
      configurable: true,
      value: tableSchema,
    });
    listeners.get("subscribed")?.forEach((listener) => {
      listener();
    });
  };

  return dataSource;
};

const Fixture = ({
  isEditMode,
  sourceDataSource,
}: {
  isEditMode: boolean;
  sourceDataSource: DataSource;
}) => {
  const { isEditSessionReady } = useEditableTable({
    dataSource: sourceDataSource,
    isEditMode,
    onCancel: vi.fn(),
    onSave: vi.fn(),
  });

  return <output data-ready={isEditSessionReady} />;
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

describe("useEditableTable session readiness", () => {
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

  it("becomes ready when the current session datasource subscribes", async () => {
    const sourceDataSource = createDataSource("subscribed");
    const sessionDataSource = createDataSource();
    sourceDataSource.createSessionDataSource = vi
      .fn()
      .mockResolvedValue(sessionDataSource);

    await act(async () => {
      root.render(<Fixture isEditMode sourceDataSource={sourceDataSource} />);
    });

    expect(container.querySelector("output")?.dataset.ready).toBe("false");
    expect(sessionDataSource.listenerCount("subscribed")).toBe(1);

    await act(async () => sessionDataSource.setSubscribed());

    expect(container.querySelector("output")?.dataset.ready).toBe("true");

    const replacementSourceDataSource = createDataSource("subscribed");
    const replacementSessionDataSource = createDataSource();
    replacementSourceDataSource.createSessionDataSource = vi
      .fn()
      .mockResolvedValue(replacementSessionDataSource);

    await act(async () => {
      root.render(
        <Fixture isEditMode sourceDataSource={replacementSourceDataSource} />,
      );
    });

    expect(container.querySelector("output")?.dataset.ready).toBe("false");
    expect(sessionDataSource.listenerCount("subscribed")).toBe(0);
    expect(replacementSessionDataSource.listenerCount("subscribed")).toBe(1);

    await act(async () => {
      root.render(
        <Fixture
          isEditMode={false}
          sourceDataSource={replacementSourceDataSource}
        />,
      );
    });

    expect(container.querySelector("output")?.dataset.ready).toBe("false");
    expect(replacementSessionDataSource.listenerCount("subscribed")).toBe(0);
  });

  it("recognizes a session datasource that is already subscribed", async () => {
    const sourceDataSource = createDataSource("subscribed");
    const sessionDataSource = createDataSource("subscribed");
    sourceDataSource.createSessionDataSource = vi
      .fn()
      .mockResolvedValue(sessionDataSource);

    await act(async () => {
      root.render(<Fixture isEditMode sourceDataSource={sourceDataSource} />);
    });

    expect(container.querySelector("output")?.dataset.ready).toBe("true");
    expect(sessionDataSource.listenerCount("subscribed")).toBe(1);
  });
});
