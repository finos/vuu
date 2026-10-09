import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { RpcResultSuccess } from "@vuu-ui/vuu-protocol-types";
import { Range } from "@vuu-ui/vuu-utils";
import {
  AllowAllPermissionFilter,
  DenyAllPermissionFilter,
  PermissionFilter,
} from "../src/core/filter/PermissionFilter";
import { PermissionFilteredTable } from "../src/core/filter/PermissionFilteredTable";
import { setCurrentUser } from "../src/core/user/CurrentUser";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import {
  NotificationModule,
  type NotificationsProvider,
} from "../src/notifications/NotificationModule";
import { NotificationsSchema } from "../src/notifications/NotificationsSchema";
import { DismissNotificationRpcHandler } from "../src/notifications/simulated/DismissNotificationRpcHandler";
import {
  formatMessage,
  SimulatedNotificationsProvider,
} from "../src/notifications/simulated/SimulatedNotificationsProvider";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "audience", serverDataType: "string" },
    { name: "priority", serverDataType: "int" },
  ],
  key: "id",
  table: { module: "TEST", table: "PermissionTest" },
};
const columnMap = buildDataColumnMapFromSchema(schema);

const createTable = () =>
  new Table(
    schema,
    [
      ["1", "all", 1],
      ["2", "admin", 2],
      ["3", "steve", 3],
      ["4", "risk_manager", 4],
    ],
    columnMap,
  );

const keys = (table: Table) => table.data.map((row) => row[0]);

describe("PermissionFilter", () => {
  it("contains filter matches allowed values", () => {
    const predicate = PermissionFilter(
      "audience",
      new Set(["all", "steve"]),
    ).createPredicate(columnMap);
    expect(
      createTable()
        .data.filter(predicate)
        .map((r) => r[0]),
    ).toEqual(["1", "3"]);
  });

  it("contains filter denies all for an unknown column or empty set", () => {
    const table = createTable();
    const unknown = PermissionFilter("nope", new Set(["all"]));
    const empty = PermissionFilter("audience", new Set());
    expect(table.data.filter(unknown.createPredicate(columnMap))).toEqual([]);
    expect(table.data.filter(empty.createPredicate(columnMap))).toEqual([]);
  });

  it("supports row predicates and chains", () => {
    const filter = PermissionFilter([
      PermissionFilter("audience", new Set(["all", "admin", "steve"])),
      PermissionFilter((row) => (row.get("priority") as number) > 1),
    ]);
    expect(
      createTable()
        .data.filter(filter.createPredicate(columnMap))
        .map((r) => r[0]),
    ).toEqual(["2", "3"]);
  });

  it("provides allow all and deny all filters", () => {
    const table = createTable();
    expect(
      table.data.filter(AllowAllPermissionFilter.createPredicate(columnMap)),
    ).toHaveLength(4);
    expect(
      table.data.filter(DenyAllPermissionFilter.createPredicate(columnMap)),
    ).toHaveLength(0);
  });
});

describe("PermissionFilteredTable", () => {
  const predicate = PermissionFilter(
    "audience",
    new Set(["all", "steve"]),
  ).createPredicate(columnMap);

  it("contains only permitted rows", () => {
    const filtered = new PermissionFilteredTable(createTable(), predicate);
    expect(keys(filtered)).toEqual(["1", "3"]);
  });

  it("mirrors inserts of permitted rows only", () => {
    const source = createTable();
    const filtered = new PermissionFilteredTable(source, predicate);
    const onInsert = vi.fn();
    filtered.on("insert", onInsert);
    source.insert(["5", "admin", 5]);
    source.insert(["6", "all", 6]);
    expect(keys(filtered)).toEqual(["1", "3", "6"]);
    expect(onInsert).toHaveBeenCalledTimes(1);
  });

  it("converts updates into inserts and deletes as rows enter and leave", () => {
    const source = createTable();
    const filtered = new PermissionFilteredTable(source, predicate);
    const onInsert = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();
    filtered.on("insert", onInsert);
    filtered.on("delete", onDelete);
    filtered.on("update", onUpdate);

    source.update("2", "audience", "all");
    expect(onInsert).toHaveBeenCalledTimes(1);
    source.update("1", "audience", "admin");
    expect(onDelete).toHaveBeenCalledWith("1");
    source.update("3", "priority", 33);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    source.update("4", "priority", 44);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    expect(keys(filtered)).toEqual(["3", "2"]);
    expect(filtered.findByKey("3")[2]).toBe(33);
  });

  it("mirrors deletes of permitted rows and stops mirroring once disposed", () => {
    const source = createTable();
    const filtered = new PermissionFilteredTable(source, predicate);
    const onDelete = vi.fn();
    filtered.on("delete", onDelete);
    source.delete("2");
    source.delete("3");
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(keys(filtered)).toEqual(["1"]);

    filtered.dispose();
    source.insert(["7", "all", 7]);
    expect(keys(filtered)).toEqual(["1"]);
  });
});

describe("NotificationsSchema", () => {
  it("includes generic and additional columns", () => {
    expect(
      NotificationsSchema.allFrom("source:String", "priority:Int"),
    ).toEqual([
      { name: "id", serverDataType: "string" },
      { name: "type", serverDataType: "string" },
      { name: "expiryTime", serverDataType: "epochtimestamp" },
      { name: "title", serverDataType: "string" },
      { name: "message", serverDataType: "string" },
      { name: "level", serverDataType: "string" },
      { name: "audience", serverDataType: "string" },
      { name: "source", serverDataType: "string" },
      { name: "priority", serverDataType: "int" },
    ]);
  });

  it("rejects invalid column definitions", () => {
    expect(() => NotificationsSchema.allFrom("source:Banana")).toThrow(
      /invalid column definition/,
    );
  });
});

describe("formatMessage", () => {
  it("formats %d, %0nd and %%", () => {
    expect(formatMessage("Order #%04d filled %d (%d%%)", 12, 300, 5)).toBe(
      "Order #0012 filled 300 (5%)",
    );
  });
});

const now = Date.now();
// prettier-ignore
const seedRows = [
  [
    "n1",
    "toast",
    now + 10_000,
    "T1",
    "M1",
    "INFO",
    "all",
    "OMS",
    1,
    "",
    "",
    now,
    now,
    "",
  ],
  [
    "n2",
    "toast",
    now + 10_000,
    "T2",
    "M2",
    "INFO",
    "risk_manager",
    "RISK",
    1,
    "",
    "",
    now,
    now,
    "",
  ],
  [
    "n3",
    "toast",
    now + 10_000,
    "T3",
    "M3",
    "INFO",
    "steve",
    "OMS",
    1,
    "",
    "",
    now,
    now,
    "",
  ],
  [
    "n4",
    "toast",
    now + 10_000,
    "T4",
    "M4",
    "INFO",
    "jane",
    "OMS",
    1,
    "",
    "",
    now,
    now,
    "",
  ],
];

const createTestModule = () => {
  const provider = { start: vi.fn(), stop: vi.fn() };
  const module = new NotificationModule(
    (table) => {
      const p: NotificationsProvider = {
        start: () => {
          provider.start();
          for (const row of seedRows) {
            table.insert(row.slice());
          }
        },
        stop: provider.stop,
      };
      return p;
    },
    (viewport) =>
      PermissionFilter("audience", new Set(["all", viewport.user.name])),
    DismissNotificationRpcHandler,
    "source:String",
    "priority:Int",
    "status:String",
    "dismissedBy:String",
  );
  return { module, provider };
};

const createSubscribedDataSource = (module: NotificationModule) => {
  const dataSource = module.createDataSource(
    "notifications",
  ) as TickingArrayDataSource;
  dataSource.subscribe({ range: Range(0, 20) }, () => undefined);
  return dataSource;
};

describe("NotificationModule", () => {
  afterEach(() => {
    setCurrentUser(undefined);
  });

  it("creates the notifications table", () => {
    const { module } = createTestModule();
    expect(module.name).toBe("NOTIFICATIONS");
    const tableSchema = module.getTableSchema("notifications");
    expect(tableSchema.table).toEqual({
      module: "NOTIFICATIONS",
      table: "notifications",
    });
    expect(tableSchema.key).toBe("id");
    expect(tableSchema.columns.map((c) => c.name)).toEqual([
      "id",
      "type",
      "expiryTime",
      "title",
      "message",
      "level",
      "audience",
      "source",
      "priority",
      "status",
      "dismissedBy",
      "vuuCreatedTimestamp",
      "vuuUpdatedTimestamp",
      "vuuMsg",
    ]);
  });

  it("starts the provider when the first dataSource is created", () => {
    const { module, provider } = createTestModule();
    expect(provider.start).not.toHaveBeenCalled();
    createSubscribedDataSource(module);
    createSubscribedDataSource(module);
    expect(provider.start).toHaveBeenCalledTimes(1);
    module.stop();
    expect(provider.stop).toHaveBeenCalledTimes(1);
  });

  it("applies the permission filter for the current user", () => {
    const { module } = createTestModule();
    setCurrentUser("steve");
    const steveDataSource = createSubscribedDataSource(module);
    setCurrentUser("jane");
    const janeDataSource = createSubscribedDataSource(module);

    expect(steveDataSource.size).toBe(2);
    expect(steveDataSource.getRowByKey("n3")).toBeDefined();
    expect(steveDataSource.getRowByKey("n4")).toBeUndefined();
    expect(janeDataSource.size).toBe(2);
    expect(janeDataSource.getRowByKey("n4")).toBeDefined();

    const table = module.tables.notifications;
    // prettier-ignore
    table.insert([
      "n5",
      "toast",
      now,
      "T5",
      "M5",
      "INFO",
      "steve",
      "OMS",
      1,
      "",
      "",
      now,
      now,
      "",
    ]);
    expect(steveDataSource.size).toBe(3);
    expect(janeDataSource.size).toBe(2);

    table.delete("n1");
    expect(steveDataSource.size).toBe(2);
    expect(janeDataSource.size).toBe(1);
  });

  it("dismissNotification marks selected rows dismissed by the viewport user", async () => {
    const { module } = createTestModule();
    setCurrentUser("steve");
    const dataSource = createSubscribedDataSource(module);
    dataSource.select({
      type: "SELECT_ROW",
      preserveExistingSelection: false,
      rowKey: "n3",
    });
    // user changes after viewport creation do not affect the viewport
    setCurrentUser("jane");

    const result = (await dataSource.rpcRequest({
      type: "RPC_REQUEST",
      rpcName: "dismissNotification",
      params: {},
    })) as RpcResultSuccess;

    expect(result).toEqual({
      type: "SUCCESS_RESULT",
      data: { success: true, dismissedCount: 1 },
    });
    const table = module.tables.notifications;
    const { map } = table;
    const row = table.findByKey("n3");
    expect(row[map.status]).toBe("dismissed");
    expect(row[map.dismissedBy]).toBe("steve");
    expect(table.findByKey("n1")[map.status]).toBe("");
    const dataSourceRow = dataSource.getRowByKey("n3");
    expect(dataSourceRow?.[map.status + 10]).toBe("dismissed");
  });
});

describe("NotificationModule.publish", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("inserts a row with defaults, visible to subscribed viewports", () => {
    const { module } = createTestModule();
    setCurrentUser("steve");
    const dataSource = createSubscribedDataSource(module);
    const before = dataSource.size;

    const id = module.publish({ title: "Hello", level: "WARNING" });

    const table = module.tables.notifications;
    const { map } = table;
    const row = table.findByKey(id);
    expect(row[map.title]).toBe("Hello");
    expect(row[map.level]).toBe("WARNING");
    expect(row[map.type]).toBe("toast");
    expect(row[map.audience]).toBe("all");
    expect(row[map.priority]).toBe(0);
    expect(row[map.vuuCreatedTimestamp]).toBeGreaterThan(0);
    expect(dataSource.size).toBe(before + 1);
    setCurrentUser(undefined);
  });

  it("updates an existing id and deletes the row at expiryTime", () => {
    vi.useFakeTimers();
    const { module } = createTestModule();
    const table = module.tables.notifications;
    const id = module.publish({ id: "p1", title: "One" });
    const created = table.findByKey(id)[table.map.vuuCreatedTimestamp];
    vi.advanceTimersByTime(10);
    module.publish({
      id: "p1",
      title: "Two",
      expiryTime: Date.now() + 1000,
    });
    expect(table.findByKey("p1")[table.map.title]).toBe("Two");
    expect(table.findByKey("p1")[table.map.vuuCreatedTimestamp]).toBe(created);
    vi.advanceTimersByTime(1000);
    expect(table.findByKey("p1")).toBeUndefined();
  });

  it("does not auto-start a provider that was stopped explicitly", () => {
    const { module, provider } = createTestModule();
    module.stop();
    createSubscribedDataSource(module);
    expect(provider.start).not.toHaveBeenCalled();
  });
});

describe("SimulatedNotificationsProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const createNotificationsTable = () => {
    const tableSchema: TableSchema = {
      columns: [
        ...NotificationsSchema.allFrom(
          "source:String",
          "priority:Int",
          "status:String",
          "dismissedBy:String",
        ),
        { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
        { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
        { name: "vuuMsg", serverDataType: "string" },
      ],
      key: "id",
      table: { module: "NOTIFICATIONS", table: "notifications" },
    };
    return new Table(
      tableSchema,
      [],
      buildDataColumnMapFromSchema(tableSchema),
    );
  };

  it("seeds, generates, caps and expires notifications", () => {
    const table = createNotificationsTable();
    const provider = new SimulatedNotificationsProvider(table);
    provider.start();
    expect(table.data).toHaveLength(3);
    const { map } = table;
    for (const row of table.data) {
      expect(typeof row[map.id]).toBe("string");
      expect(row[map.expiryTime]).toBeGreaterThan(Date.now());
      expect(row[map.message]).not.toMatch(/%0?\d*d/);
    }

    vi.advanceTimersByTime(4_000);
    expect(table.data).toHaveLength(4);

    // Shortest duration is 10s, longest 60s. Expired rows are deleted.
    vi.advanceTimersByTime(4_000 * 20);
    const nowMs = Date.now();
    expect(table.data.length).toBeLessThanOrEqual(8);
    for (const row of table.data) {
      expect(row[map.expiryTime] as number).toBeGreaterThanOrEqual(
        nowMs - 4_000,
      );
    }

    provider.stop();
    const count = table.data.length;
    vi.advanceTimersByTime(40_000);
    expect(table.data).toHaveLength(count);
  });
});
