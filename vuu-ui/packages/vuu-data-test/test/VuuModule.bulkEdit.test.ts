import type { DataSourceConfig } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import { LimitsModule, limitsSchemas } from "../src/limits";
import type { Table } from "../src/Table";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";

const columns = limitsSchemas.limitDefinitions.columns.map(({ name }) => name);

const vega = {
  entity_id: "DESK-EQD",
  hard: 100,
  metric: "Vega",
  period: "Intraday",
  soft: 90,
  warning: 80,
};

let viewportCount = 0;

const setup = async () => {
  const module = new LimitsModule();
  const dataSource = module.createDataSource(
    "limitDefinitions",
    `bulk-edit-vp-${++viewportCount}`,
    { columns } as DataSourceConfig,
  ) as TickingArrayDataSource;
  const { limitDefinitions } = module.tables;

  const editSession = async () =>
    (await dataSource.createSessionDataSource(
      "All",
      "edit",
    )) as TickingArrayDataSource;

  const seed = await editSession();
  await seed.addRow(vega);
  await seed.addRow({ ...vega, entity_id: "DESK-CASH" });
  await seed.addRow({ ...vega, entity_id: "DESK-RATES", hard: 150 });
  await seed.endEditSession(true);

  const session = await editSession();
  const sessionTable = (
    module as unknown as { getSessionTable(name: string): Table }
  ).getSessionTable(session.table?.table as string);

  /** vuuAction and hard of each session table row, by key. */
  const sessionRows = () => {
    const { map } = sessionTable;
    return Object.fromEntries(
      sessionTable.data.map((row) => [
        row[map.limit_key],
        { hard: row[map.hard], vuuAction: row[map.vuuAction] },
      ]),
    );
  };

  const bulkEdit = (column: string, value: VuuRowDataItemType) =>
    session.rpcRequest({
      params: { column, value },
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
      type: "RPC_REQUEST",
    });

  const hard = (key: string) =>
    limitDefinitions.findByKey(key)?.[limitDefinitions.map.hard];

  return { bulkEdit, hard, session, sessionRows };
};

describe("VP_BULK_EDIT_COLUMN_CELLS_RPC", () => {
  it("marks changed rows editCell, keeps added rows addRow and skips deleted rows", async () => {
    const { bulkEdit, session, sessionRows } = await setup();
    await session.deleteRow("LIM-0002", "soft");
    await session.addRow({ ...vega, period: "Overnight" });

    const result = await bulkEdit("hard", 150);
    expect(result).toMatchObject({ type: "SUCCESS_RESULT" });
    const rows = sessionRows();
    expect(rows["LIM-0001"]).toEqual({ hard: 150, vuuAction: "editCell" });
    expect(rows["LIM-0002"]).toEqual({ hard: 100, vuuAction: "deleteRow" });
    const added = Object.entries(rows).find(
      ([key]) => !["LIM-0001", "LIM-0002", "LIM-0003"].includes(String(key)),
    );
    expect(added?.[1]).toEqual({ hard: 150, vuuAction: "addRow" });
  });

  it("leaves rows that already have the value unmarked", async () => {
    const { bulkEdit, sessionRows } = await setup();
    await bulkEdit("hard", 150);
    expect(sessionRows()["LIM-0003"]).toEqual({ hard: 150, vuuAction: "" });
  });

  it("is saved like any other edit", async () => {
    const { bulkEdit, hard, session } = await setup();
    await bulkEdit("hard", 150);
    await session.endEditSession(true);
    expect(hard("LIM-0001")).toBe(150);
    expect(hard("LIM-0002")).toBe(150);
  });

  it("rejects an invalid value and changes nothing", async () => {
    const { bulkEdit, sessionRows } = await setup();
    const before = sessionRows();
    const result = await bulkEdit("hard", -1);
    expect(result).toMatchObject({
      type: "ERROR_RESULT",
      errorMessage: "hard must be a number greater than zero",
    });
    expect(sessionRows()).toEqual(before);
  });
});
