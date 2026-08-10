import type {
  DataSource,
  DataSourceEvents,
  DataSourceRow,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceSubscribedMessage,
  DataSourceStatus,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { EventEmitter, Range } from "@vuu-ui/vuu-utils";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDataSource } from "../src/table-data-source/useDataSource";

const actEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const makeSchema = (
  table: string,
  column: string,
  maxRangeEnd?: number,
): TableSchema => ({
  columns: [{ name: column, serverDataType: "string" }],
  key: "id",
  rangeLimits:
    maxRangeEnd === undefined
      ? undefined
      : { maxRangeEnd, maxRangeWidth: maxRangeEnd },
  table: { module: "TEST", table },
});

const makeRow = (index: number, key: string, value: string) =>
  [index, index, true, false, 0, 0, key, 0, 0, false, value] as DataSourceRow;

class MockDataSource extends EventEmitter<DataSourceEvents> {
  callbacks: DataSourceSubscribeCallback[] = [];
  columns: string[];
  currentCallback?: DataSourceSubscribeCallback;
  range = Range(0, 0);
  status: DataSourceStatus = "initialising";
  tableSchema: TableSchema;

  constructor(
    readonly name: string,
    column: string,
    maxRangeEnd?: number,
  ) {
    super();
    this.columns = [column];
    this.tableSchema = makeSchema(name, column, maxRangeEnd);
  }

  subscribe = vi.fn(
    async (
      { range }: DataSourceSubscribeProps,
      callback: DataSourceSubscribeCallback,
    ) => {
      this.currentCallback = callback;
      this.callbacks.push(callback);
      this.range = range ?? this.range;
      this.status = "subscribing";
    },
  );

  suspend = vi.fn(() => {
    this.status = "suspended";
  });

  resume = vi.fn((callback?: DataSourceSubscribeCallback) => {
    if (callback) {
      this.currentCallback = callback;
      this.callbacks.push(callback);
    }
    this.status = "subscribed";
    this.emit("resumed", this.name);
  });

  enable = vi.fn((callback?: DataSourceSubscribeCallback) => {
    if (callback) {
      this.currentCallback = callback;
      this.callbacks.push(callback);
    }
    this.status = "subscribed";
  });

  unsubscribe = vi.fn();

  publishSubscribed(callback = this.currentCallback) {
    this.status = "subscribed";
    callback?.({
      aggregations: [],
      clientViewportId: this.name,
      columns: this.columns,
      filterSpec: { filter: "" },
      groupBy: [],
      range: this.range,
      sort: { sortDefs: [] },
      tableSchema: this.tableSchema,
      type: "subscribed",
    } as DataSourceSubscribedMessage);
  }

  publishRows(value: string, callback = this.currentCallback, size = 10) {
    callback?.({
      clientViewportId: this.name,
      mode: "batch",
      rows: [makeRow(this.range.from, `${this.name}-row`, value)],
      size,
      type: "viewport-update",
    });
  }

  asDataSource() {
    return this as unknown as DataSource;
  }
}

type HookResult = ReturnType<typeof useDataSource>;

const Probe = ({
  dataSource,
  onResult,
  onSelect,
  onSizeChange,
  onSubscribed,
}: {
  dataSource: DataSource;
  onResult: (result: HookResult) => void;
  onSelect: ReturnType<typeof vi.fn>;
  onSizeChange: ReturnType<typeof vi.fn>;
  onSubscribed: ReturnType<typeof vi.fn>;
}) => {
  const result = useDataSource({
    autoSelectFirstRow: true,
    dataSource,
    onSelect,
    onSizeChange,
    onSubscribed,
  });

  useEffect(() => {
    onResult(result);
  }, [onResult, result]);

  return null;
};

describe("useDataSource datasource switching", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("switches subscriptions, ignores late messages, and can switch back", async () => {
    const source = new MockDataSource("source", "name", 100);
    const session = new MockDataSource("session", "label");
    const sourceRemoveListener = vi.spyOn(source, "removeListener");
    const sessionOn = vi.spyOn(session, "on");
    const onSelect = vi.fn();
    const onSizeChange = vi.fn();
    const onSubscribed = vi.fn();
    let latest: HookResult | undefined;
    const onResult = (result: HookResult) => {
      latest = result;
    };
    const render = async (dataSource: MockDataSource) => {
      await act(async () => {
        root.render(
          <Probe
            dataSource={dataSource.asDataSource()}
            onResult={onResult}
            onSelect={onSelect}
            onSizeChange={onSizeChange}
            onSubscribed={onSubscribed}
          />,
        );
      });
    };

    await render(source);
    await act(async () => {
      latest?.setRange({ from: 5, to: 7 });
      source.publishSubscribed();
      source.publishRows("source-value");
    });

    expect(latest?.dataRows[0]?.name).toBe("source-value");
    expect(onSelect).toHaveBeenCalledTimes(1);
    const staleSourceCallback = source.callbacks[0];

    await render(session);

    expect(source.suspend).toHaveBeenCalledTimes(1);
    expect(source.unsubscribe).not.toHaveBeenCalled();
    expect(sourceRemoveListener).toHaveBeenCalledWith(
      "resumed",
      expect.any(Function),
    );
    expect(session.subscribe).toHaveBeenCalledTimes(1);
    expect(sessionOn).toHaveBeenCalledWith("resumed", expect.any(Function));
    expect(session.subscribe.mock.calls[0][0].range).toMatchObject({
      from: 5,
      to: 7,
    });
    expect(latest?.dataRows.filter(Boolean)).toEqual([]);

    await act(async () => {
      session.publishSubscribed();
      session.publishRows("session-value");
    });

    expect(latest?.dataRows[0]?.label).toBe("session-value");
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSizeChange).toHaveBeenLastCalledWith(10, Number.MAX_SAFE_INTEGER);

    await act(async () => {
      source.publishRows("late-source-value", staleSourceCallback, 99);
    });

    expect(latest?.dataRows[0]?.label).toBe("session-value");
    expect(onSizeChange).not.toHaveBeenLastCalledWith(99, 100);

    await render(source);

    expect(session.suspend).toHaveBeenCalledTimes(1);
    expect(source.subscribe).toHaveBeenCalledTimes(1);
    expect(source.resume).toHaveBeenCalledTimes(1);

    await act(async () => {
      source.publishRows("source-value-after-return");
    });

    expect(latest?.dataRows[0]?.name).toBe("source-value-after-return");
    expect(onSelect).toHaveBeenCalledTimes(3);
  });
});
