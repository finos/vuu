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
});
