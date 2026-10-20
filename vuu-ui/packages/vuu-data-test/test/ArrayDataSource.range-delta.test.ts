import { describe, expect, it } from "vitest";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type {
  DataSourceCallbackMessage,
  DataSourceRow,
} from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { metadataKeys, Range } from "@vuu-ui/vuu-utils";

const ROW_COUNT = 1000;
const PAGE_SIZE = 30;
const RENDER_BUFFER = 5;

const columnDescriptors: ColumnDescriptor[] = [
  { name: "id", serverDataType: "string" },
  { name: "value", serverDataType: "double" },
];

const data = Array.from({ length: ROW_COUNT }, (_, i) => [`row-${i}`, i]);

/** row indices in [from, to) */
const indices = ({ from, to }: { from: number; to: number }) =>
  Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);

const setUp = () => {
  const dataSource = new ArrayDataSource({
    columnDescriptors,
    data: data as never,
    keyColumn: "id",
  });
  const sent: number[][] = [];
  dataSource.subscribe(
    { range: Range(0, PAGE_SIZE, RENDER_BUFFER) },
    (message: DataSourceCallbackMessage) => {
      if (message.type === "viewport-update" && message.rows) {
        sent.push(
          (message.rows as DataSourceRow[]).map(
            (row) => row[metadataKeys.IDX] as number,
          ),
        );
      }
    },
  );
  const scrollTo = (from: number) => {
    sent.length = 0;
    dataSource.range = Range(from, from + PAGE_SIZE, RENDER_BUFFER);
    return sent.flat().sort((a, b) => a - b);
  };
  return { dataSource, scrollTo };
};

/** rows that enter the buffered range when moving from one page to another */
const enteringRows = (fromPage: number, toPage: number) => {
  const before = new Set(
    indices(Range(fromPage, fromPage + PAGE_SIZE, RENDER_BUFFER).withBuffer),
  );
  return indices(
    Range(toPage, toPage + PAGE_SIZE, RENDER_BUFFER).withBuffer,
  ).filter((i) => !before.has(i));
};

describe("ArrayDataSource, rows sent on range change", () => {
  it("scrolling down sends only the rows that enter the buffered range", () => {
    const { scrollTo } = setUp();
    scrollTo(100);
    for (let from = 103; from <= 130; from += 3) {
      expect(scrollTo(from)).toEqual(enteringRows(from - 3, from));
    }
  });

  it("scrolling up sends only the rows that enter the buffered range", () => {
    const { scrollTo } = setUp();
    scrollTo(500);
    for (let from = 497; from >= 470; from -= 3) {
      expect(scrollTo(from)).toEqual(enteringRows(from + 3, from));
    }
  });

  it("a jump with no overlap sends the full buffered range", () => {
    const { scrollTo } = setUp();
    scrollTo(100);
    expect(scrollTo(800)).toEqual(
      indices(Range(800, 800 + PAGE_SIZE, RENDER_BUFFER).withBuffer),
    );
  });
});
