// The hooks a module overrides to take part in session table editing:
// validateEdit, sessionTableChanged, createRowKey and duplicateKeyMessage.
import type { DataSourceConfig, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import { type SessionTableDef, VuuModule } from "../src/core/module/VuuModule";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "name", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
  ],
  key: "id",
  table: { module: "HOOKS_TEST", table: "items" },
};

class HooksModule extends VuuModule<"items"> {
  protected menus = { items: undefined };
  protected schemas = { items: schema };
  protected tables: Record<"items", Table>;
  protected visualLinks = undefined;
  protected menuServices = undefined;
  protected services = { items: undefined };
  protected editableTables: readonly "items"[] = ["items"];
  protected sessionTableDefs: Record<string, SessionTableDef> = {
    "edit-items": {
      columns: [...schema.columns, { name: "label", serverDataType: "string" }],
      key: "id",
    },
  };
  #nextKey = 1;

  constructor() {
    super("HOOKS_TEST");
    this.tables = {
      items: new Table(
        schema,
        [
          ["A", "Alpha", 1.5],
          ["B", "Beta", 2.5],
          ["C", "Gamma", 3],
        ],
        buildDataColumnMapFromSchema(schema),
      ),
    };
  }

  session(name: string) {
    return this.getSessionTable(name);
  }

  protected validateEdit(
    _tableName: "items",
    column: string,
    value: VuuRowDataItemType,
  ) {
    return column === "price" && Number(value) <= 0
      ? "price must be greater than zero"
      : undefined;
  }

  /** label, maintained by the server, is "<name> at <price>". */
  protected sessionTableChanged(_tableName: "items", sessionTable: Table) {
    const { map } = sessionTable;
    for (const row of sessionTable.data) {
      const label = `${row[map.name]} at ${row[map.price]}`;
      if (row[map.label] !== label) {
        sessionTable.update(String(row[map.id]), "label", label);
      }
    }
  }

  protected createRowKey() {
    return `ITEM-${this.#nextKey++}`;
  }

  protected duplicateKeyMessage(_tableName: "items" | undefined, key: string) {
    return `item ${key} already exists`;
  }
}

const setup = async () => {
  const module = new HooksModule();
  const source = module.createDataSource("items", "hooks-source-vp", {
    columns: ["id", "name", "price"],
  } as DataSourceConfig) as TickingArrayDataSource;
  const session = (await source.createSessionDataSource(
    "All",
    "edit",
  )) as TickingArrayDataSource;
  const sessionTable = module.session(session.table?.table as string);
  const { map } = sessionTable;
  /** Each session row's price, label and vuuAction, by key. */
  const rows = () =>
    Object.fromEntries(
      sessionTable.data.map((row) => [
        row[map.id],
        {
          label: row[map.label],
          price: row[map.price],
          vuuAction: row[map.vuuAction],
        },
      ]),
    );
  const bulkEdit = (column: string, value: VuuRowDataItemType) =>
    session.rpcRequest({
      params: { column, value },
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
      type: "RPC_REQUEST",
    });
  return { bulkEdit, rows, session };
};

describe("VuuModule session hooks", () => {
  it("sessionTableChanged runs when the session table is created and after each request", async () => {
    const { rows, session } = await setup();
    expect(rows().A.label).toBe("Alpha at 1.5");
    await session.editCell("A", "price", 2);
    expect(rows().A.label).toBe("Alpha at 2");
  });

  it("validateEdit rejects an editCell", async () => {
    const { rows, session } = await setup();
    expect(await session.editCell("A", "price", 0)).toMatchObject({
      type: "ERROR_RESULT",
      errorMessage: "price must be greater than zero",
    });
    expect(rows().A).toMatchObject({ price: 1.5, vuuAction: "" });
  });

  it("createRowKey keys a row added without one, duplicateKeyMessage rejects a key in use", async () => {
    const { rows, session } = await setup();
    expect(await session.addRow({ name: "Delta", price: 4 })).toEqual({
      type: "SUCCESS_RESULT",
      data: { key: "ITEM-1" },
    });
    expect(rows()["ITEM-1"]).toEqual({
      label: "Delta at 4",
      price: 4,
      vuuAction: "addRow",
    });
    expect(await session.addRow({ id: "B", name: "Beta", price: 1 })).toEqual({
      type: "ERROR_RESULT",
      errorMessage: "item B already exists",
    });
  });

  describe("VP_BULK_EDIT_COLUMN_CELLS_RPC", () => {
    it("marks changed rows editCell, keeps added rows addRow, skips deleted rows and rows with the value", async () => {
      const { bulkEdit, rows, session } = await setup();
      await session.deleteRow("B", "soft");
      await session.addRow({ name: "Delta", price: 4 });

      expect(await bulkEdit("price", 3)).toMatchObject({
        type: "SUCCESS_RESULT",
      });
      expect(rows()).toEqual({
        A: { label: "Alpha at 3", price: 3, vuuAction: "editCell" },
        B: { label: "Beta at 2.5", price: 2.5, vuuAction: "deleteRow" },
        C: { label: "Gamma at 3", price: 3, vuuAction: "" },
        "ITEM-1": { label: "Delta at 3", price: 3, vuuAction: "addRow" },
      });
    });

    it("validates the value first and changes nothing when it is rejected", async () => {
      const { bulkEdit, rows } = await setup();
      const before = rows();
      expect(await bulkEdit("price", -1)).toEqual({
        type: "ERROR_RESULT",
        errorMessage: "price must be greater than zero",
      });
      expect(rows()).toEqual(before);
    });
  });
});
