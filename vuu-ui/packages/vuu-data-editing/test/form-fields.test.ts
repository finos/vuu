import type { TableSchema } from "@vuu-ui/vuu-data-types";
import { describe, expect, it } from "vitest";
import { getFormFields } from "../src/form-fields";

const schema: TableSchema = {
  columns: [
    { name: "ric", serverDataType: "string" },
    { name: "description", serverDataType: "string" },
    { name: "lotSize", serverDataType: "int" },
    { editable: false, name: "isin", serverDataType: "string" },
    { name: "vuuCreatedTimestamp", serverDataType: "long" },
    { name: "vuuMsg", serverDataType: "string" },
  ],
  key: "ric",
  table: { module: "TEST", table: "instruments" },
};

const names = (fields: { name: string }[]) => fields.map(({ name }) => name);

describe("getFormFields", () => {
  it("generates a field per schema column, except server-maintained ones", () => {
    expect(names(getFormFields({ schema }))).toEqual([
      "ric",
      "description",
      "lotSize",
      "isin",
    ]);
  });

  it("puts table columns first, in order, then the rest of the schema", () => {
    const fields = getFormFields({
      columns: [{ name: "lotSize" }, { name: "notInSchema" }, { name: "ric" }],
      schema,
    });
    expect(names(fields)).toEqual(["lotSize", "ric", "description", "isin"]);
  });

  it("overlays table columns on schema columns, narrowing editable", () => {
    const [ric, lotSize, isin] = getFormFields({
      columns: [
        {
          editable: { insert: true, update: false },
          label: "RIC",
          name: "ric",
        },
        {
          editor: { name: "dropdown-cell", values: ["1", "10"] },
          label: "Lot size",
          name: "lotSize",
          serverDataType: "string",
        },
        // can't widen what the server allows
        { editable: true, name: "isin" },
      ],
      schema,
    });
    expect(ric).toEqual({
      editable: { insert: true, update: false },
      label: "RIC",
      name: "ric",
      serverDataType: "string",
    });
    expect(lotSize).toEqual({
      editable: true,
      editor: { name: "dropdown-cell", values: ["1", "10"] },
      label: "Lot size",
      name: "lotSize",
      // the schema's type wins
      serverDataType: "int",
    });
    expect(isin.editable).toBe(false);
  });

  it("uses fields, in order, overlaid on schema and table columns", () => {
    const fields = getFormFields({
      columns: [{ label: "RIC", name: "ric" }],
      fields: [{ name: "lotSize", required: true }, { name: "ric" }],
      schema,
    });
    expect(fields).toEqual([
      {
        editable: true,
        name: "lotSize",
        required: true,
        serverDataType: "int",
      },
      { editable: true, label: "RIC", name: "ric", serverDataType: "string" },
    ]);
  });

  it("leaves out fields that can't be set on insert", () => {
    const fields = getFormFields({
      columns: [{ editable: { insert: false, update: true }, name: "lotSize" }],
      operation: "insert",
      schema,
    });
    expect(names(fields)).toEqual(["ric", "description"]);
  });

  it("generates fields from the columns when there is no schema", () => {
    const fields = getFormFields({
      columns: [
        { name: "ric", serverDataType: "string" },
        { name: "vuuMsg", serverDataType: "string" },
      ],
    });
    expect(fields).toEqual([
      { editable: true, name: "ric", serverDataType: "string" },
    ]);
  });
});
