import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { VuuDataRow, VuuRow, VuuSortCol } from "@vuu-ui/vuu-protocol-types";
import { Clock, IKeySet } from "@vuu-ui/vuu-utils";

const created = 2;

export class RowBuilder {
  #count = 0;
  constructor(private clock: Clock) {}
  makeVuuRows(
    from: number,
    to: number,
    sort?: VuuSortCol[],
  ): VuuRow<VuuDataRow>[] {
    const rows: VuuRow<VuuDataRow>[] = [];
    for (let i = from; i < to; i++) {
      const rowKey = this.nextKey;
      rows.push({
        rowIndex: 0,
        rowKey,
        data: [rowKey, 1000 + i, this.clock.now],
        ts: this.clock.now,
      } as VuuRow<VuuDataRow>);
      this.clock.advance(100);
    }

    const sortedRows = sort ? this.sortRowsDescending(rows, created) : rows;
    return sortedRows.map(this.addRowIndex);
  }

  private get nextKey() {
    this.#count += 1;
    return `KEY${this.#count.toString().padStart(5, "0")}`;
  }

  private addRowIndex = (row: VuuRow, i: number) => {
    row.rowIndex = i;
    return row;
  };

  private sortRowsDescending(rows: Array<VuuRow<VuuDataRow>>, i: number) {
    return rows.sort(({ data: r1 }, { data: r2 }) =>
      r1[i] > r2[i] ? -1 : r2[i] > r1[i] ? 1 : 0,
    );
  }
}

export function makeVuuSizeRow(vpSize: number): VuuRow<VuuDataRow> {
  return {
    rowIndex: -1,
    rowKey: "SIZE",
    data: [],
    sel: 0,
    ts: Date.now(),
    updateType: "SIZE",
    viewPortId: "",
    vpSize,
    vpVersion: "",
  } as VuuRow;
}

export function makeVuuRows(from: number, to: number): VuuRow<VuuDataRow>[] {
  const rows: VuuRow<VuuDataRow>[] = [];
  for (let i = from; i < to; i++) {
    const key = `key-${i}`;
    rows.push({
      rowIndex: i,
      rowKey: key,
      data: [key, 1000 + i],
      ts: 10000 + i,
    } as VuuRow<VuuDataRow>);
  }

  return rows;
}

export function makeDataSourceRows(
  from: number,
  to: number,
  keys?: number[] | IKeySet,
): DataSourceRow[] {
  const rows: DataSourceRow[] = [];
  for (let i = from; i < to; i++) {
    const key = `key-${i}`;
    rows.push([
      i,
      Array.isArray(keys) ? keys[i] : (keys?.keyFor(i) ?? i),
      true,
      false,
      0,
      0,
      key,
      0,
      10000 + i,
      false,
      // data ...
      key,
      1000 + i,
    ] as DataSourceRow);
  }
  return rows;
}
