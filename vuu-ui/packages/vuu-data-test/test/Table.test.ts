import { describe, expect, it, vi } from "vitest";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";
import { TableSchema } from "@vuu-ui/vuu-data-types";

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "data", serverDataType: "string" },
  ],
  key: "id",
  table: { module: "TEST", table: "TestTable" },
};

describe("Table", () => {
  it("can be created from a schema", () => {
    const table = new Table(schema, [], buildDataColumnMapFromSchema(schema));
    expect(table.data).toEqual([]);
  });

  it("emits events when rows are inserted", () => {
    const callback = vi.fn();
    const table = new Table(schema, [], buildDataColumnMapFromSchema(schema));
    table.on("insert", callback);

    table.insert(["00001", "data 1"]);
    table.insert(["00002", "data 2"]);
    table.insert(["00003", "data 3"]);
    table.insert(["00004", "data 4"]);
    table.insert(["00005", "data 5"]);
    table.insert(["00006", "data 6"]);

    expect(table.data.length).toEqual(6);
    expect(callback).toHaveBeenCalledTimes(6);
  });

  it("accepts data array", () => {
    const table = new Table(
      schema,
      [
        ["00001", "data 1"],
        ["00002", "data 2"],
        ["00003", "data 3"],
        ["00004", "data 4"],
        ["00005", "data 5"],
        ["00006", "data 6"],
      ],
      buildDataColumnMapFromSchema(schema),
    );

    expect(table.data.length).toEqual(6);
  });

  it("finds row by key", () => {
    const table = new Table(
      schema,
      [
        ["00001", "data 1"],
        ["00002", "data 2"],
        ["00003", "data 3"],
        ["00004", "data 4"],
        ["00005", "data 5"],
        ["00006", "data 6"],
      ],
      buildDataColumnMapFromSchema(schema),
    );

    expect(table.findByKey("00003")).toEqual(["00003", "data 3"]);
  });

  it("deletes a row by key", () => {
    const table = new Table(
      schema,
      [
        ["00001", "data 1"],
        ["00002", "data 2"],
        ["00003", "data 3"],
        ["00004", "data 4"],
        ["00005", "data 5"],
        ["00006", "data 6"],
      ],
      buildDataColumnMapFromSchema(schema),
    );

    table.delete("00002");
    expect(table.data.length).toEqual(5);

    expect(table.findByKey("00005")).toEqual(["00005", "data 5"]);
  });
});
