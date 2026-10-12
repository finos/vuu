import { describe, expect, it } from "vitest";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { metadataKeys, Range, setDefaultTimeZone } from "@vuu-ui/vuu-utils";

const day = Date.UTC(2024, 2, 15);
const hour = 3_600_000;

const columnDescriptors: ColumnDescriptor[] = [
  { name: "id", serverDataType: "string" },
  { name: "tradeTime", serverDataType: "epochtimestamp" },
  { name: "tradeTimeNanos", serverDataType: "epochtimestampnano" },
  { name: "legacyTime", serverDataType: "long" },
];

const data = [
  ["1", day - hour, BigInt(day - hour) * 1_000_000n, day - hour],
  ["2", day + hour, BigInt(day + hour) * 1_000_000n + 1n, day + hour],
  ["3", day + 23 * hour, BigInt(day + 23 * hour) * 1_000_000n, day + 23 * hour],
  ["4", day + 25 * hour, BigInt(day + 25 * hour) * 1_000_000n, day + 25 * hour],
];

const getIds = async (dataSource: ArrayDataSource) =>
  new Promise<string[]>((resolve) => {
    dataSource.subscribe({ range: Range(0, 10) }, (message) => {
      if (message.type === "viewport-update" && message.rows) {
        resolve(
          (message.rows as DataSourceRow[]).map(
            (row) => row[metadataKeys.count] as string,
          ),
        );
      }
    });
  });

const createDataSource = () =>
  new ArrayDataSource({
    columnDescriptors,
    data: data as never,
    keyColumn: "id",
  });

describe("ArrayDataSource, filters on temporal columns", () => {
  setDefaultTimeZone("UTC");

  it("a date '=' filter on an epochtimestamp column matches the whole day", async () => {
    const dataSource = createDataSource();
    dataSource.setFilter({ column: "tradeTime", op: "=", value: day });
    expect(dataSource.filter.filter).toEqual(
      `tradeTime >= ${day} and tradeTime < ${day + 24 * hour}`,
    );
    expect(await getIds(dataSource)).toEqual(["2", "3"]);
  });

  it("a date '=' filter on an epochtimestampnano column matches the whole day", async () => {
    const dataSource = createDataSource();
    dataSource.setFilter({
      column: "tradeTimeNanos",
      op: "=",
      value: `${day}000000`,
    });
    expect(await getIds(dataSource)).toEqual(["2", "3"]);
  });

  it("a filter on a legacy long column uses client column descriptors", async () => {
    const dataSource = createDataSource();
    dataSource.setFilter(
      { column: "legacyTime", op: ">", value: day },
      {
        columnsByName: {
          legacyTime: { name: "legacyTime", type: "date/time" },
        },
      },
    );
    expect(await getIds(dataSource)).toEqual(["4"]);
  });

  it("a filter on a legacy long column uses the type from its own column descriptors", async () => {
    const dataSource = new ArrayDataSource({
      columnDescriptors: columnDescriptors.map((col) =>
        col.name === "legacyTime" ? { ...col, type: "date/time" } : col,
      ),
      data: data as never,
      keyColumn: "id",
    });
    dataSource.setFilter({ column: "legacyTime", op: "=", value: day });
    expect(dataSource.filter.filter).toEqual(
      `legacyTime >= ${day} and legacyTime < ${day + 24 * hour}`,
    );
    expect(await getIds(dataSource)).toEqual(["2", "3"]);
  });
});
