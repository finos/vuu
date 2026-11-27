// Session table blueprints (sessionTableDefs), as in Scala Vuu's
// ModuleFactory.addSessionTable + createSessionTable.
import type { DataSourceConfig, TableSchema } from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import {
  type RpcService,
  type SessionTableDef,
  VuuModule,
} from "../src/core/module/VuuModule";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "name", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
  ],
  key: "id",
  table: { module: "BP_TEST", table: "items" },
};

const itemsDef: SessionTableDef = { columns: schema.columns, key: "id" };

class BlueprintModule extends VuuModule<"items"> {
  protected menus = { items: undefined };
  protected schemas = { items: schema };
  protected tables: Record<"items", Table>;
  protected visualLinks = undefined;
  protected menuServices = undefined;
  protected services = { items: undefined };
  protected editableTables: readonly "items"[];
  protected sessionTableDefs: Record<string, SessionTableDef>;

  constructor({
    editable = true,
    sessionTableDefs = { "edit-items": itemsDef },
  }: {
    editable?: boolean;
    sessionTableDefs?: Record<string, SessionTableDef>;
  } = {}) {
    super("BP_TEST");
    this.tables = {
      items: new Table(
        schema,
        [
          ["A", "Alpha", 1.5],
          ["B", "Beta", 2.5],
        ],
        buildDataColumnMapFromSchema(schema),
      ),
    };
    this.editableTables = editable ? ["items"] : [];
    this.sessionTableDefs = sessionTableDefs;
  }

  get items() {
    return this.tables.items;
  }

  session(name: string) {
    return this.getSessionTable(name);
  }
}

const sourceDataSource = (module: VuuModule<"items">) =>
  module.createDataSource("items", "source-vp", {
    columns: ["id", "name"],
  } as DataSourceConfig) as TickingArrayDataSource;

const createSessionTable = (
  ds: TickingArrayDataSource,
  params: Record<string, unknown>,
) =>
  ds.rpcRequest({
    type: "RPC_REQUEST",
    rpcName: "createSessionTable",
    params,
  } as never) as Promise<RpcResult>;

const sessionTableName = (result: RpcResult) => {
  if (result.type === "ERROR_RESULT") throw Error(result.errorMessage);
  return (result.data as { table: VuuTable }).table.table;
};

const error = (errorMessage: string): RpcResult => ({
  type: "ERROR_RESULT",
  errorMessage,
});

describe("VuuModule session table blueprints", () => {
  it("requires a sessionType", async () => {
    const ds = sourceDataSource(new BlueprintModule());
    expect(await createSessionTable(ds, { copyOption: "All" })).toEqual(
      error("Session type undefined"),
    );
  });

  it("fails when no blueprint is defined, there is no fallback", async () => {
    const ds = sourceDataSource(new BlueprintModule());
    expect(
      await createSessionTable(ds, {
        copyOption: "All",
        sessionType: "export",
      }),
    ).toEqual(error("session table export-items is not defined"));
    expect(
      await createSessionTable(ds, {
        copyOption: "All",
        sessionType: "edit",
        sessionTableName: "missing",
      }),
    ).toEqual(error("session table missing is not defined"));
    await expect(ds.createSessionDataSource("All", "export")).rejects.toThrow(
      "session table export-items is not defined",
    );
  });

  it("edit and import need an editable table, export does not", async () => {
    const module = new BlueprintModule({
      editable: false,
      sessionTableDefs: { "export-items": itemsDef, "edit-items": itemsDef },
    });
    const ds = sourceDataSource(module);
    for (const sessionType of ["edit", "import"]) {
      expect(
        await createSessionTable(ds, { copyOption: "All", sessionType }),
      ).toEqual(error("Table not editable"));
    }
    const name = sessionTableName(
      await createSessionTable(ds, {
        copyOption: "All",
        sessionType: "export",
      }),
    );
    expect(module.session(name).data).toHaveLength(2);
  });

  it("edit needs a copyOption, import is always empty", async () => {
    const module = new BlueprintModule({
      sessionTableDefs: { "edit-items": itemsDef, "import-items": itemsDef },
    });
    const ds = sourceDataSource(module);
    expect(await createSessionTable(ds, { sessionType: "edit" })).toEqual(
      error("Missing or invalid copy option."),
    );
    const name = sessionTableName(
      await createSessionTable(ds, {
        copyOption: "All",
        sessionType: "import",
      }),
    );
    expect(module.session(name).data).toEqual([]);
  });

  it("sessionTableName selects a blueprint with its own columns and key", async () => {
    const module = new BlueprintModule({
      sessionTableDefs: {
        "rename-items": {
          columns: [
            { name: "itemId", serverDataType: "string" },
            { name: "name", serverDataType: "string" },
            { name: "note", serverDataType: "string" },
          ],
          key: "itemId",
        },
      },
    });
    const ds = sourceDataSource(module);
    const name = sessionTableName(
      await createSessionTable(ds, {
        columnsToCopy: "id,name",
        copyOption: "All",
        sessionTableName: "rename-items",
        sessionType: "edit",
      }),
    );
    const sessionTable = module.session(name);
    expect(sessionTable.schema.columns.map(({ name }) => name)).toEqual([
      "itemId",
      "name",
      "note",
      "vuuMsg",
      "vuuAction",
    ]);
    expect(sessionTable.findByKey("A")?.slice(0, 5)).toEqual([
      "A",
      "Alpha",
      "",
      "",
      "",
    ]);

    const session = module.createDataSource(name as "items", name, {
      columns: ["itemId", "name", "note"],
    } as DataSourceConfig) as TickingArrayDataSource;
    expect(await session.editCell("A", "name", "Alpha edited")).toMatchObject({
      type: "SUCCESS_RESULT",
    });
    expect(await session.editCell("B", "note", "session only")).toMatchObject({
      type: "SUCCESS_RESULT",
    });
    await session.addRow({ itemId: "C", name: "Gamma", note: "added" });
    await session.endEditSession(true);

    const { items } = module;
    expect(items.findByKey("A")?.slice(0, 3)).toEqual([
      "A",
      "Alpha edited",
      // a column the session table does not have keeps its source value
      1.5,
    ]);
    expect(items.findByKey("B")?.slice(0, 3)).toEqual(["B", "Beta", 2.5]);
    expect(items.findByKey("C")?.slice(0, 3)).toEqual(["C", "Gamma", ""]);
  });

  it("undo restores the copied columns from the source row", async () => {
    const module = new BlueprintModule();
    const ds = sourceDataSource(module);
    const session = (await ds.createSessionDataSource("All", "edit", {
      columnsToCopy: ["id", "name"],
    })) as TickingArrayDataSource;
    const sessionTable = module.session(session.table?.table as string);
    await session.editCell("A", "name", "edited");
    await session.editCell("A", "price", 9.5);
    await session.undoRowChange("A");
    // price was not copied, so undo leaves it as the session has it
    expect(sessionTable.findByKey("A")?.slice(0, 3)).toEqual([
      "A",
      "Alpha",
      9.5,
    ]);
  });

  it("columnsToCopy must name source columns", async () => {
    const ds = sourceDataSource(new BlueprintModule());
    expect(
      await createSessionTable(ds, {
        columnsToCopy: "id,nope",
        copyOption: "All",
        sessionType: "edit",
      }),
    ).toEqual(error("Column(s) not found in source table."));
  });

  it("copies Selected rows, up to maxSessionTableSize", async () => {
    class One extends BlueprintModule {
      protected maxSessionTableSize = 1;
    }
    const module = new One();
    const ds = sourceDataSource(module);
    const all = sessionTableName(
      await createSessionTable(ds, { copyOption: "All", sessionType: "edit" }),
    );
    expect(module.session(all).data).toHaveLength(1);

    const module2 = new BlueprintModule();
    const ds2 = sourceDataSource(module2);
    ds2.select({
      preserveExistingSelection: false,
      rowKey: "B",
      type: "SELECT_ROW",
    } as Parameters<typeof ds2.select>[0]);
    const selected = sessionTableName(
      await createSessionTable(ds2, {
        copyOption: "Selected",
        sessionType: "edit",
      }),
    );
    expect(module2.session(selected).data.map((row) => row[0])).toEqual(["B"]);
  });

  it("session viewports use the blueprint's services, which replace built-ins", async () => {
    const calls: string[] = [];
    const services: RpcService[] = [
      {
        rpcName: "endEditSession",
        service: async () => {
          calls.push("endEditSession");
          return { type: "SUCCESS_RESULT", data: undefined };
        },
      },
    ];
    const module = new BlueprintModule({
      sessionTableDefs: { "edit-items": { ...itemsDef, services } },
    });
    const ds = sourceDataSource(module);
    const session = (await ds.createSessionDataSource(
      "All",
      "edit",
    )) as TickingArrayDataSource;
    await session.editCell("A", "name", "edited");
    await session.endEditSession(true);
    expect(calls).toEqual(["endEditSession"]);
    // the blueprint's endEditSession did not save to the source table
    expect(module.items.findByKey("A")?.[1]).toBe("Alpha");
  });

  it("beginEditSession works without a blueprint or editableTables", async () => {
    const module = new BlueprintModule({
      editable: false,
      sessionTableDefs: {},
    });
    const ds = sourceDataSource(module);
    const session = (await ds.beginEditSession(
      "all-rows",
    )) as TickingArrayDataSource;
    await session.editCell("A", "name", "edited");
    await session.endEditSession(true);
    expect(module.items.findByKey("A")?.[1]).toBe("edited");
  });
});
