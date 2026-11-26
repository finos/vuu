import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import { NextDayChanges } from "../src/core/module/NextDayChanges";
import { VUU_DEFAULT_COLUMNS } from "../src/default-column-definitions";
import { Table } from "../src/Table";

const ruleColumns = [
  { name: "name", serverDataType: "string" },
  { name: "threshold", serverDataType: "int" },
] as const;

const rulesSchema: TableSchema = {
  columns: [
    { name: "rule_id", serverDataType: "string" },
    { name: "active", serverDataType: "boolean" },
    ...ruleColumns,
    { name: "change", serverDataType: "string" },
    { name: "changed_by", serverDataType: "string" },
    ...VUU_DEFAULT_COLUMNS,
  ],
  key: "rule_id",
  table: { module: "TEST", table: "rules" },
};

const sessionSchema: TableSchema = {
  columns: [
    { name: "rule_id", serverDataType: "string" },
    ...ruleColumns,
    { name: "editChange", serverDataType: "string" },
    { name: "vuuAction", serverDataType: "string" },
    { name: "vuuMsg", serverDataType: "string" },
  ],
  key: "rule_id",
  table: { module: "TEST", table: "session-rules" },
};

const columnMap = (schema: TableSchema) =>
  Object.fromEntries(schema.columns.map(({ name }, i) => [name, i]));

const setup = () => {
  const rules = new Table(rulesSchema, [], columnMap(rulesSchema));
  const changes = new NextDayChanges({
    columns: ruleColumns,
    entityName: "rule",
    table: rules,
    user: "ops",
    validate: ({ threshold }) =>
      Number(threshold) > 0 ? undefined : "threshold must be above zero",
  });

  /** A session table holding these rows, as an edit session would. */
  const session = (
    ...rows: { rule_id: string; vuuAction: string; [c: string]: unknown }[]
  ) =>
    new Table(
      sessionSchema,
      rows.map((row) =>
        sessionSchema.columns.map(
          ({ name }) => (row[name] ?? "") as VuuRowDataItemType,
        ),
      ),
      columnMap(sessionSchema),
    );

  const rule = (key: string) => {
    const row = rules.findByKey(key);
    return row === undefined
      ? undefined
      : Object.fromEntries(
          ["active", "change", "changed_by", "name", "threshold"].map(
            (name) => [name, row[rules.map[name]]],
          ),
        );
  };
  return { changes, rule, rules, session };
};

describe("NextDayChanges", () => {
  it("adds a rule that is not active until the next business day", () => {
    const { changes, rule, session } = setup();
    const add = { name: "Fat finger", rule_id: "R1", threshold: 10 };
    expect(changes.save(session({ ...add, vuuAction: "addRow" }))).toEqual({
      type: "SUCCESS_RESULT",
      data: undefined,
    });
    expect(rule("R1")).toMatchObject({
      active: false,
      change: "New rule",
      changed_by: "ops",
    });
    changes.activatePending();
    expect(rule("R1")).toMatchObject({ active: true, change: "" });
  });

  it("holds a change to an active rule, and describes it", () => {
    const { changes, rule, session } = setup();
    const add = { name: "Fat finger", rule_id: "R1", threshold: 10 };
    changes.save(session({ ...add, vuuAction: "addRow" }));
    changes.activatePending();

    const edit = session({ ...add, threshold: 20, vuuAction: "editCell" });
    changes.describeEdits(edit);
    expect(edit.data[0][edit.map.editChange]).toBe("threshold changes to 20");
    changes.save(edit);
    expect(rule("R1")).toMatchObject({
      active: true,
      change: "threshold changes to 20",
      threshold: 10,
    });
    changes.activatePending();
    expect(rule("R1")).toMatchObject({ change: "", threshold: 20 });
  });

  it("saves nothing when a row is invalid", () => {
    const { changes, rule, session } = setup();
    const result = changes.save(
      session(
        { name: "A", rule_id: "R1", threshold: 10, vuuAction: "addRow" },
        { name: "B", rule_id: "R2", threshold: 0, vuuAction: "addRow" },
      ),
    );
    expect(result).toEqual({
      type: "ERROR_RESULT",
      errorMessage:
        "1 rule could not be saved. R2: threshold must be above zero",
    });
    expect(rule("R1")).toBeUndefined();
  });

  it("treats rows loaded with active true as Active", () => {
    const { changes, rule, rules, session } = setup();
    rules.insert(
      rules.schema.columns.map(
        ({ name }) =>
          ({ rule_id: "R1", active: true, name: "Fat finger", threshold: 10 })[
            name
          ] ?? "",
      ),
    );
    const edit = session({
      name: "Fat finger",
      rule_id: "R1",
      threshold: 20,
      vuuAction: "editCell",
    });
    changes.describeEdits(edit);
    expect(edit.data[0][edit.map.editChange]).toBe("threshold changes to 20");
    changes.save(edit);
    expect(rule("R1")).toMatchObject({
      active: true,
      change: "threshold changes to 20",
      threshold: 10,
    });
  });
});
