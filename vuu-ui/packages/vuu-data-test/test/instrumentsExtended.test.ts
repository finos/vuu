import { describe, expect, it } from "vitest";
import { instrumentsExtendedTable } from "../src/simul/reference-data/instruments-extended";
import { schemas } from "../src/simul/simul-schemas";

const { columns } = schemas.instrumentsExtended;
const columnIndex = (name: string) =>
  columns.findIndex((column) => column.name === name);

const valuesOf = (name: string) =>
  instrumentsExtendedTable.data.map((row) => row[columnIndex(name)]);

describe("instrumentsExtended", () => {
  it("covers every Vuu column data type", () => {
    const types = new Set(columns.map((column) => column.serverDataType));
    expect([...types].sort()).toEqual([
      "boolean",
      "char",
      "double",
      "epochtimestamp",
      "int",
      "long",
      "scaleddecimal2",
      "scaleddecimal4",
      "scaleddecimal6",
      "scaleddecimal8",
      "string",
    ]);
  });

  it("builds rows that match the schema", () => {
    const [row] = instrumentsExtendedTable.data;
    expect(row).toHaveLength(columns.length);
    for (const [index, { serverDataType }] of columns.entries()) {
      const value = row[index];
      switch (serverDataType) {
        case "boolean":
          expect(typeof value).toBe("boolean");
          break;
        case "int":
        case "long":
        case "double":
        case "epochtimestamp":
          expect(typeof value).toBe("number");
          break;
        case "char":
          expect(value).toMatch(/^[BS]$/);
          break;
        default:
          expect(typeof value).toBe("string");
      }
    }
  });

  it("sends scaled decimals as scaled integer strings, edge cases first", () => {
    expect(valuesOf("notional").slice(0, 6)).toEqual([
      "0",
      "-123450",
      "10000",
      "1",
      "-1",
      "150",
    ]);
    expect(valuesOf("weight").slice(0, 6)).toEqual([
      "0",
      "-123450000000",
      "10000000000",
      "1",
      "-1",
      "150000000",
    ]);
    for (const name of ["notional", "closePrice", "fxRate", "weight"]) {
      expect(valuesOf(name).every((v) => /^-?\d+$/.test(String(v)))).toBe(true);
    }
  });
});
