import type { DataSourceConfig } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import {
  LimitsModule,
  limitsSchemas,
  validateLimitDefinition,
  validateLimitValue,
} from "../src/limits";
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

const setup = () => {
  const module = new LimitsModule();
  const dataSource = module.createDataSource(
    "limitDefinitions",
    `limits-vp-${++viewportCount}`,
    { columns } as DataSourceConfig,
  ) as TickingArrayDataSource;
  const { limitDefinitions } = module.tables;

  const row = (key: string) => {
    const values = limitDefinitions.findByKey(key);
    return values === undefined
      ? undefined
      : (Object.fromEntries(
          columns.map((name) => [name, values[limitDefinitions.map[name]]]),
        ) as Record<string, VuuRowDataItemType>);
  };

  const editSession = async () =>
    (await dataSource.createSessionDataSource(
      "All",
      "edit",
    )) as TickingArrayDataSource;

  const addLimits = async (...limits: Record<string, VuuRowDataItemType>[]) => {
    const session = await editSession();
    for (const limit of limits) {
      await session.addRow(limit);
    }
    await session.endEditSession(true);
  };

  /** The editChange of each row of an edit session, by key. */
  const editChanges = (session: TickingArrayDataSource) => {
    const sessionTable = (
      module as unknown as { getSessionTable(name: string): Table }
    ).getSessionTable(session.table?.table as string);
    const { map } = sessionTable;
    return Object.fromEntries(
      sessionTable.data.map((row) => [row[map.limit_key], row[map.editChange]]),
    );
  };

  return { addLimits, dataSource, editChanges, editSession, module, row };
};

describe("validateLimitValue", () => {
  it("accepts a blank value, required columns are checked on save", () => {
    expect(validateLimitValue("entity_id", "")).toBeUndefined();
    expect(validateLimitValue("hard", "")).toBeUndefined();
  });

  it("checks values against the reference data", () => {
    expect(validateLimitValue("entity_id", "NOPE")).toBe(
      "entity NOPE is not known",
    );
    expect(validateLimitValue("metric", "Vega")).toBeUndefined();
    expect(validateLimitValue("hard", -1)).toBe(
      "hard must be a number greater than zero",
    );
  });
});

describe("validateLimitDefinition", () => {
  it("checks required columns and rules across columns", () => {
    expect(validateLimitDefinition(vega)).toBeUndefined();
    expect(validateLimitDefinition({ ...vega, hard: "" })).toBe(
      "hard is required",
    );
    expect(validateLimitDefinition({ ...vega, period: "Daily" })).toBe(
      "period of Vega must be Intraday or Overnight",
    );
    expect(validateLimitDefinition({ ...vega, soft: 200 })).toBe(
      "soft must not be greater than hard",
    );
    expect(validateLimitDefinition({ ...vega, warning: 95 })).toBe(
      "warning must not be greater than soft or hard",
    );
    expect(
      validateLimitDefinition({
        ...vega,
        effective_from: Date.UTC(2027, 0, 2),
        effective_to: Date.UTC(2027, 0, 1),
      }),
    ).toBe("effective_to must not be before effective_from");
  });
});

describe("LimitsModule", () => {
  it("saves a new limit, not yet active, with the columns the server fills", async () => {
    const { addLimits, row } = setup();
    await addLimits(vega);
    expect(row("LIM-0001")).toMatchObject({
      ...vega,
      change: "New limit",
      entity_type: "Desk",
      changed_by: "trader",
      metric_family: "Sensitivity",
      active: false,
    });
    expect(row("LIM-0001")?.effective_from).toBeGreaterThan(0);
  });

  it("saves nothing unless every row is valid", async () => {
    const { editSession, module, row } = setup();
    const session = await editSession();
    await session.addRow(vega);
    await session.addRow({ ...vega, soft: 200 });
    await expect(session.endEditSession(true)).rejects.toThrow(
      "1 limit could not be saved. LIM-0002: soft must not be greater than hard",
    );
    expect(module.tables.limitDefinitions.data).toHaveLength(0);
    expect(row("LIM-0001")).toBeUndefined();
  });

  it("on the next business day, a new limit becomes Active", async () => {
    const { addLimits, module, row } = setup();
    await addLimits(vega);
    module.activatePendingLimits();
    expect(row("LIM-0001")).toMatchObject({ change: "", active: true });
  });

  it("the activatePendingLimits RPC applies pending changes", async () => {
    const { addLimits, dataSource, row } = setup();
    await addLimits(vega);
    const result = await dataSource.rpcRequest?.({
      params: {},
      rpcName: "activatePendingLimits",
      type: "RPC_REQUEST",
    });
    expect(result).toMatchObject({ type: "SUCCESS_RESULT" });
    expect(row("LIM-0001")).toMatchObject({ active: true });
  });

  it("a change to an Active limit is held until the next business day", async () => {
    const { addLimits, editSession, module, row } = setup();
    await addLimits(vega);
    module.activatePendingLimits();

    const session = await editSession();
    await session.editCell("LIM-0001", "hard", 150);
    await session.endEditSession(true);
    expect(row("LIM-0001")).toMatchObject({
      change: "hard changes to 150",
      changed_by: "trader",
      hard: 100,
      active: true,
    });

    module.activatePendingLimits();
    expect(row("LIM-0001")).toMatchObject({
      change: "",
      hard: 150,
      active: true,
    });
  });

  it("editChange describes the change saving each row will make", async () => {
    const { addLimits, editChanges, editSession, module } = setup();
    await addLimits(vega, { ...vega, entity_id: "DESK-CASH" });
    module.activatePendingLimits();

    const session = await editSession();
    expect(editChanges(session)).toEqual({ "LIM-0001": "", "LIM-0002": "" });
    await session.editCell("LIM-0001", "hard", 150);
    await session.editCell("LIM-0001", "soft", 95);
    await session.deleteRow("LIM-0002", "soft");
    await session.addRow({ ...vega, entity_id: "DESK-RATES" });
    expect(editChanges(session)).toEqual({
      "LIM-0001": "soft changes to 95, hard changes to 150",
      "LIM-0002": "Set to delete",
      "LIM-0003": "New limit",
    });
  });

  it("editChange describes this session's edits, change includes changes already held", async () => {
    const { addLimits, editChanges, editSession, module, row } = setup();
    await addLimits(vega);
    module.activatePendingLimits();

    const first = await editSession();
    await first.editCell("LIM-0001", "hard", 150);
    await first.endEditSession(true);

    const second = await editSession();
    expect(editChanges(second)).toEqual({ "LIM-0001": "" });
    await second.editCell("LIM-0001", "soft", 95);
    expect(editChanges(second)).toEqual({ "LIM-0001": "soft changes to 95" });
    await second.endEditSession(true);
    expect(row("LIM-0001")).toMatchObject({
      change: "soft changes to 95, hard changes to 150",
      hard: 100,
      soft: 90,
      active: true,
    });

    module.activatePendingLimits();
    expect(row("LIM-0001")).toMatchObject({
      change: "",
      hard: 150,
      soft: 95,
      active: true,
    });
  });

  it("a new limit, not yet active, is changed directly", async () => {
    const { addLimits, editSession, row } = setup();
    await addLimits(vega);
    const session = await editSession();
    await session.editCell("LIM-0001", "hard", 150);
    await session.endEditSession(true);
    expect(row("LIM-0001")).toMatchObject({
      change: "New limit",
      hard: 150,
      active: false,
    });
  });

  it("deleting an Active limit waits for the next business day, a new one is removed", async () => {
    const { addLimits, editSession, module, row } = setup();
    await addLimits(vega);
    module.activatePendingLimits();
    await addLimits({ ...vega, entity_id: "DESK-CASH" });

    const session = await editSession();
    await session.deleteRow("LIM-0001", "soft");
    await session.deleteRow("LIM-0002", "soft");
    await session.endEditSession(true);
    expect(row("LIM-0002")).toBeUndefined();
    expect(row("LIM-0001")).toMatchObject({
      change: "Set to delete",
      active: true,
    });

    module.activatePendingLimits();
    expect(row("LIM-0001")).toBeUndefined();
  });

  it("names an invalid import row by its line in the file", async () => {
    const { dataSource, module } = setup();
    const session = (await dataSource.createSessionDataSource(
      "All",
      "import",
    )) as TickingArrayDataSource;
    await session.addRow({ ...vega, vuuRowNum: 1 });
    await session.addRow({ ...vega, period: "Daily", vuuRowNum: 2 });
    await expect(session.endEditSession(true)).rejects.toThrow(
      "1 limit could not be saved. line 3: period of Vega must be Intraday or Overnight",
    );
    expect(module.tables.limitDefinitions.data).toHaveLength(0);
  });
});
