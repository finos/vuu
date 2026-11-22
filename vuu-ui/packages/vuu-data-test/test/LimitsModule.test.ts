import type { DataSourceConfig } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import {
  LimitsModule,
  limitsSchemas,
  validateLimitDefinition,
  validateLimitValue,
} from "../src/limits";
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

  return { addLimits, dataSource, editSession, module, row };
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
  it("saves a new limit as Pending, with the columns the server fills", async () => {
    const { addLimits, row } = setup();
    await addLimits(vega);
    expect(row("LIM-0001")).toMatchObject({
      ...vega,
      change: "New limit",
      entity_type: "Desk",
      changed_by: "trader",
      metric_family: "Sensitivity",
      status: "Pending",
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
    expect(row("LIM-0001")).toMatchObject({ change: "", status: "Active" });
  });

  it("a change to an Active limit is held until the next business day", async () => {
    const { addLimits, editSession, module, row } = setup();
    await addLimits(vega);
    module.activatePendingLimits();

    const session = await editSession();
    await session.editCell("LIM-0001", "hard", 150);
    await session.endEditSession(true);
    expect(row("LIM-0001")).toMatchObject({
      change: "hard 100 → 150",
      changed_by: "trader",
      hard: 100,
      status: "Pending",
    });

    module.activatePendingLimits();
    expect(row("LIM-0001")).toMatchObject({
      change: "",
      hard: 150,
      status: "Active",
    });
  });

  it("a Pending new limit is changed directly", async () => {
    const { addLimits, editSession, row } = setup();
    await addLimits(vega);
    const session = await editSession();
    await session.editCell("LIM-0001", "hard", 150);
    await session.endEditSession(true);
    expect(row("LIM-0001")).toMatchObject({
      change: "New limit",
      hard: 150,
      status: "Pending",
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
      change: "Delete",
      status: "Pending",
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
