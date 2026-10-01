// Bridges a real VUU DataSource (packages/vuu-data-remote) into ag-grid's
// Enterprise Viewport Row Model (rowModelType: "viewport") - a third ag-grid
// row model, distinct from both the client-side and Server-Side Row Models
// used elsewhere in this benchmark. Unlike SSRM's request/response getRows,
// the viewport row model is push-based: VUU tells the grid what changed via
// direct row-node mutation, matching VUU's own push/range protocol closely.
//
// This is a deliberately trimmed-down port of the reference implementation
// at https://github.com/finos/vuu/tree/showcase/ag-grid-examples
// (packages/vuu-data-ag-grid) - grouping, tree rows, context menus and
// visual links are dropped since this benchmark's grid is flat, but the
// core row-window/diffing logic (AgDataWindow) and the update/batch mode
// handling in VuuViewportDatasource are carried over as-is: that code
// exists specifically because of several real bugs the original authors
// hit and fixed over time (stale field diffing, size-message churn,
// scroll-direction edge cases) - re-deriving it from scratch would just
// reintroduce the same bugs.
import type {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceRow,
} from "@vuu-ui/vuu-data-types";
import { buildColumnMap, metadataKeys, type ColumnMap, Range, WindowRange } from "@vuu-ui/vuu-utils";
import type { IRowNode, IViewportDatasource, IViewportDatasourceParams } from "ag-grid-community";

const { IDX } = metadataKeys;

export type AgVuuDataRow = { vuuKey: string; [key: string]: unknown };

const toAgGridRow = (data: DataSourceRow, columnMap: ColumnMap): AgVuuDataRow => {
  const row: AgVuuDataRow = { vuuKey: data[metadataKeys.KEY] as string };
  for (const colName of Object.keys(columnMap)) {
    row[colName] = data[columnMap[colName]];
  }
  return row;
};

const reverseColumnMap = (columnMap: ColumnMap): Map<number, string> =>
  new Map(Object.entries(columnMap).map(([name, idx]) => [idx, name]));

/**
 * Tracks which rows are currently loaded for the grid's current scroll
 * range, so that a "batch" (fresh range load) can be told apart from an
 * "update" (live tick) and, for updates, only the fields that actually
 * changed get pushed into the ag-grid row node (needed for
 * enableCellChangeFlash to fire correctly - a wholesale row replace doesn't
 * register as a per-cell value change the same way).
 */
class AgDataWindow {
  #range: WindowRange;
  #data: (DataSourceRow | undefined)[];
  rowCount = 0;

  constructor(from: number, to: number) {
    this.#range = new WindowRange(from, to);
    this.#data = new Array(to - from);
  }

  setRowCount(rowCount: number) {
    if (rowCount < this.#data.length) {
      this.#data.length = rowCount;
    }
    this.rowCount = rowCount;
  }

  add(row: DataSourceRow) {
    const [index] = row;
    if (this.#range.isWithin(index)) {
      this.#data[index - this.#range.from] = row;
    }
  }

  /** Returns a flat [field, value, field, value, ...] list of only the fields that changed, or undefined if this row isn't cached yet. */
  diffAndUpdate(row: DataSourceRow, reverseMap: Map<number, string>): unknown[] | undefined {
    const [index] = row;
    const cached = this.#data[index - this.#range.from];
    if (!cached) return undefined;
    let updates: unknown[] | undefined;
    for (let i = metadataKeys.count; i < cached.length; i++) {
      if (cached[i] !== row[i]) {
        const field = reverseMap.get(i);
        if (field) {
          cached[i] = row[i];
          (updates ??= []).push(field, row[i]);
        }
      }
    }
    return updates;
  }

  setRange(from: number, to: number) {
    if (from === this.#range.from && to === this.#range.to) return;
    const [overlapFrom, overlapTo] = this.#range.overlap(from, to);
    const newData = new Array(to - from);
    for (let i = overlapFrom; i < overlapTo; i++) {
      const existing = this.#data[i - this.#range.from];
      if (existing) newData[i - from] = existing;
    }
    this.#data = newData;
    this.#range = new WindowRange(from, to);
  }
}

export class VuuViewportDatasource implements IViewportDatasource {
  #dataSource: DataSource;
  #columnMap: ColumnMap;
  #reverseColumnMap: Map<number, string>;
  #dataWindow = new AgDataWindow(0, 0);
  #params: IViewportDatasourceParams | undefined;

  constructor(dataSource: DataSource) {
    this.#dataSource = dataSource;
    this.#columnMap = buildColumnMap(dataSource.columns);
    this.#reverseColumnMap = reverseColumnMap(this.#columnMap);
    this.#dataSource.subscribe({}, this.#handleMessage);
  }

  init(params: IViewportDatasourceParams): void {
    this.#params = params;
  }

  // Called by ag-grid when the user scrolls - directly mirrors how VUU's
  // own Table drives dataSource.range as the visible window changes.
  setViewportRange(firstRow: number, lastRow: number): void {
    // ag-grid has been seen to call this with lastRow < firstRow transiently.
    const safeLastRow = Math.max(firstRow, lastRow + 1);
    this.#dataWindow.setRange(firstRow, safeLastRow);
    this.#dataSource.range = Range(firstRow, safeLastRow);
  }

  sort(column: string, direction: "asc" | "desc") {
    this.#dataSource.sort = {
      sortDefs: [{ column, sortType: direction === "asc" ? "A" : "D" }],
    };
  }

  filter(filter: string) {
    this.#dataSource.filter = { filter };
  }

  #handleMessage = (message: DataSourceCallbackMessage) => {
    if (message.type !== "viewport-update") return;
    const params = this.#params;
    if (!params) return;

    if (message.size !== undefined && message.size !== this.#dataWindow.rowCount) {
      this.#dataWindow.setRowCount(message.size);
      params.setRowCount(message.size, false);
    }

    if (!message.rows) return;

    if (message.mode === "update") {
      for (const row of message.rows) {
        const rowIndex = row[IDX] as number;
        const rowNode: IRowNode = params.getRow(rowIndex);
        if (rowNode.data) {
          const updates = this.#dataWindow.diffAndUpdate(row, this.#reverseColumnMap);
          if (updates) {
            for (let i = 0; i < updates.length; i += 2) {
              rowNode.setDataValue(updates[i] as string, updates[i + 1]);
            }
          } else {
            // First sight of this row's data window slot, even though
            // ag-grid already has *some* data there (e.g. a prior instrument
            // occupied this index before a sort/filter change) - seed the
            // cache now so subsequent diffs against this slot have
            // something to compare against. In practice VUU's real server
            // labels every message "update", including the very first push
            // for a freshly (re)loaded range, so there's no reliable
            // "batch" signal to seed the cache from instead.
            this.#dataWindow.add(row);
          }
        } else {
          rowNode.setData(toAgGridRow(row, this.#columnMap));
          this.#dataWindow.add(row);
        }
      }
    } else {
      // Defensive fallback for any DataSource implementation that *does*
      // send a distinct non-"update" mode for a fresh full range load.
      const rowData: { [index: number]: AgVuuDataRow } = {};
      for (const row of message.rows) {
        this.#dataWindow.add(row);
        rowData[row[IDX] as number] = toAgGridRow(row, this.#columnMap);
      }
      params.setRowData(rowData);
    }
  };

  destroy(): void {
    this.#dataSource.unsubscribe();
  }
}
