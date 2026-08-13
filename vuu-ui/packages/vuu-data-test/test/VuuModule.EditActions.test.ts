import type { DataSourceConfig, TableSchema } from "@vuu-ui/vuu-data-types";
import { beforeEach, describe, expect, it } from "vitest";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import { VuuModule } from "../src/core/module/VuuModule";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "name", serverDataType: "string" },
  ],
  key: "id",
  table: { module: "EDIT_TEST", table: "items" },
};

class EditingModule extends VuuModule<"items"> {
  protected menus = { items: undefined };
  protected schemas = { items: schema };
  protected tables: Record<"items", Table>;
  protected visualLinks = undefined;

  constructor(table: Table) {
    super("EDIT_TEST");
    this.tables = { items: table };
  }

  getSessionTableForTest() {
    const [sessionTable] = Object.values(this.sessionTableMap);
    if (!sessionTable) {
      throw Error("Expected an active session table");
    }
    return sessionTable;
  }
}

describe("VuuModule edit actions", () => {
  let module: EditingModule;
  let sourceTable: Table;
  let sessionDataSource: TickingArrayDataSource;
  let sessionTable: Table;

  beforeEach(async () => {
    sourceTable = new Table(
      schema,
      [
        ["row-001", "Alice"],
        ["row-002", "Bob"],
      ],
      buildDataColumnMapFromSchema(schema),
    );
    module = new EditingModule(sourceTable);
    const sourceDataSource = module.createDataSource("items", "source-vp", {
      columns: ["id", "name"],
    } as DataSourceConfig) as TickingArrayDataSource;
    sessionDataSource = (await sourceDataSource.createSessionDataSource(
      "All",
    )) as TickingArrayDataSource;
    sessionTable = module.getSessionTableForTest();
  });

  it("records each edit RPC and preserves addRow after editing an inserted row", async () => {
    await sessionDataSource.editCell("row-001", "name", "Alicia");
    await sessionDataSource.addRow({ id: "row-003", name: "Carol" });
    await sessionDataSource.editCell("row-003", "name", "Caroline");
    await sessionDataSource.deleteRow("row-002", "soft");

    expect(
      sessionTable.findByKey("row-001")?.[sessionTable.map.vuu_action],
    ).toBe("editCell");
    expect(
      sessionTable.findByKey("row-002")?.[sessionTable.map.vuu_action],
    ).toBe("deleteRow");
    expect(
      sessionTable.findByKey("row-003")?.[sessionTable.map.vuu_action],
    ).toBe("addRow");
  });

  it("applies recorded actions to the source table when the session is saved", async () => {
    await sessionDataSource.editCell("row-001", "name", "Alicia");
    await sessionDataSource.addRow({ id: "row-003", name: "Carol" });
    await sessionDataSource.editCell("row-003", "name", "Caroline");
    await sessionDataSource.deleteRow("row-002", "soft");

    await sessionDataSource.endEditSession(true);

    expect(sourceTable.findByKey("row-001")?.[sourceTable.map.name]).toBe(
      "Alicia",
    );
    expect(sourceTable.findByKey("row-002")).toBeUndefined();
    expect(sourceTable.findByKey("row-003")?.[sourceTable.map.name]).toBe(
      "Caroline",
    );
  });

  it("uses vuu_action to undo inserts, edits, and deletes", async () => {
    await sessionDataSource.editCell("row-001", "name", "Alicia");
    await sessionDataSource.deleteRow("row-002", "soft");
    await sessionDataSource.addRow({ id: "row-003", name: "Carol" });

    await sessionDataSource.undoRowChange("row-001");
    await sessionDataSource.undoRowChange("row-002");
    const insertResult = await sessionDataSource.undoRowChange("row-003");

    expect(sessionTable.findByKey("row-001")?.[sessionTable.map.name]).toBe(
      "Alice",
    );
    expect(
      sessionTable.findByKey("row-001")?.[sessionTable.map.vuu_action],
    ).toBe("");
    expect(
      sessionTable.findByKey("row-002")?.[sessionTable.map.vuu_action],
    ).toBe("");
    expect(sessionTable.findByKey("row-003")).toBeUndefined();
    expect(insertResult).toEqual({
      type: "SUCCESS_RESULT",
      data: { wasInsertedRow: true },
    });
  });

  it("deselects all rows after deleting the selected rows", async () => {
    sessionDataSource.select({
      preserveExistingSelection: false,
      rowKey: "row-001",
      type: "SELECT_ROW",
    });
    sessionDataSource.select({
      preserveExistingSelection: true,
      rowKey: "row-002",
      type: "SELECT_ROW",
    });

    const result = await sessionDataSource.deleteSelectedRows("soft");

    expect(result).toEqual({
      type: "SUCCESS_RESULT",
      data: { deletedKeys: ["row-001", "row-002"] },
    });
    expect(sessionDataSource.getSelectedRowIds()).toEqual([]);
  });
});
