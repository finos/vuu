/**
 * Checks that the legacy TickingArrayDataSource (@vuu-ui/vuu-data-test) and
 * the engine ModuleDataSource produce the same results for the config
 * scenarios measured in bench/datasource.bench.ts, so the benchmark compares
 * equivalent work.
 */
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  buildDataColumnMapFromSchema as buildLegacyDataMap,
  TickingArrayDataSource as LegacyDataSource,
  Table as LegacyTable,
} from "@vuu-ui/vuu-data-test";
import { Range } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import { ModuleDataSource } from "../src/ModuleDataSource";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";

const DATA = 10;
const ROWS = 2_000;

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "ccy", serverDataType: "string" },
    { name: "side", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    { name: "qty", serverDataType: "int" },
  ],
  key: "id",
  table: { module: "BENCH", table: "orders" },
};

const CCY = ["USD", "EUR", "GBP", "JPY"];

const createData = () => {
  let seed = 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: ROWS }, (_, i) => [
    `id-${i}`,
    CCY[Math.floor(random() * CCY.length)],
    random() < 0.5 ? "BUY" : "SELL",
    Math.round(random() * 100_000) / 100,
    Math.floor(random() * 10_000),
  ]);
};

type ParityDataSource = {
  sort: unknown;
  filter: unknown;
  groupBy: unknown;
  readonly size: number;
  getRowAtIndex: (index: number) => unknown[] | undefined;
};

const createPair = async () => {
  const data = createData();
  const legacyTable = new LegacyTable(
    schema,
    data.map((row) => row.slice()),
    buildLegacyDataMap(schema),
  );
  const legacy = new LegacyDataSource({
    columnDescriptors: schema.columns,
    table: legacyTable,
  });
  const engineTable = new Table(
    schema,
    data.map((row) => row.slice()),
    buildDataColumnMapFromSchema(schema),
  );
  const engine = new ModuleDataSource({
    columnDescriptors: schema.columns,
    table: engineTable,
  });
  await legacy.subscribe({ range: Range(0, 50) }, () => undefined);
  await engine.subscribe({ range: Range(0, 50) }, () => undefined);
  return [
    legacy as unknown as ParityDataSource,
    engine as unknown as ParityDataSource,
  ] as const;
};

const columnValues = (
  dataSource: ParityDataSource,
  column: number,
  count = 50,
) =>
  Array.from(
    { length: count },
    (_, i) => dataSource.getRowAtIndex(i)?.[DATA + column],
  );

describe("legacy vs engine parity", () => {
  it("unconfigured size and rows", async () => {
    const [legacy, engine] = await createPair();
    expect(engine.size).toBe(legacy.size);
    expect(columnValues(engine, 0)).toEqual(columnValues(legacy, 0));
  });

  it("sort numeric column asc and desc", async () => {
    const [legacy, engine] = await createPair();
    for (const sortType of ["A", "D"]) {
      const sort = { sortDefs: [{ column: "price", sortType }] };
      legacy.sort = sort;
      engine.sort = sort;
      expect(columnValues(engine, 3)).toEqual(columnValues(legacy, 3));
    }
  });

  it("sort two columns", async () => {
    const [legacy, engine] = await createPair();
    const sort = {
      sortDefs: [
        { column: "ccy", sortType: "A" },
        { column: "qty", sortType: "D" },
      ],
    };
    legacy.sort = sort;
    engine.sort = sort;
    expect(columnValues(engine, 1)).toEqual(columnValues(legacy, 1));
    expect(columnValues(engine, 4)).toEqual(columnValues(legacy, 4));
  });

  it("filters", async () => {
    const [legacy, engine] = await createPair();
    for (const filter of ['ccy = "EUR" and price > 500', 'side = "BUY"']) {
      legacy.filter = { filter };
      engine.filter = { filter };
      expect(engine.size).toBe(legacy.size);
      expect(columnValues(engine, 0)).toEqual(columnValues(legacy, 0));
    }
  });

  it("groupBy size", async () => {
    const [legacy, engine] = await createPair();
    legacy.groupBy = ["ccy"];
    engine.groupBy = ["ccy"];
    expect(engine.size).toBe(legacy.size);
    expect(engine.size).toBe(CCY.length);
    legacy.groupBy = [];
    engine.groupBy = [];
    expect(engine.size).toBe(legacy.size);
  });
});
