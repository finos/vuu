import type {
  DataSource,
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  buildColumnMap,
  type ColumnMap,
  EventEmitter,
  metadataKeys,
  Range,
} from "@vuu-ui/vuu-utils";

const { IDX } = metadataKeys;

export const DEFAULT_MAX_ROWS = 1000;

export type ChartDataStoreEvents = {
  update: () => void;
};

export interface ChartDataStoreOptions {
  /**
   * The number of rows requested from the DataSource (the viewport range
   * will be 0 - maxRows). Default 1000.
   */
  maxRows?: number;
}

/**
 * Subscribes to a single DataSource and keeps a dense, index-ordered copy of
 * the rows within the subscribed range. Emits 'update' whenever rows or size
 * change. Consumers (chart projections) read `rows` and `columnMap`.
 *
 * A DataSource supports a single subscriber, so each DataSource used by a
 * chart should not be shared with another component (e.g. a Table).
 */
export class ChartDataStore extends EventEmitter<ChartDataStoreEvents> {
  #columnMap: ColumnMap;
  #dataSource: DataSource;
  #denseRows: DataSourceRow[] | undefined = undefined;
  #maxRows: number;
  #rows: Array<DataSourceRow | undefined> = [];
  #size = 0;
  #subscribed = false;
  #version = 0;

  constructor(
    dataSource: DataSource,
    { maxRows = DEFAULT_MAX_ROWS }: ChartDataStoreOptions = {},
  ) {
    super();
    this.#dataSource = dataSource;
    this.#maxRows = maxRows;
    this.#columnMap = buildColumnMap(dataSource.columns);
  }

  get columnMap() {
    return this.#columnMap;
  }

  get dataSource() {
    return this.#dataSource;
  }

  get isSubscribed() {
    return this.#subscribed;
  }

  /**
   * The rows currently held, in DataSource (index) order, with no gaps.
   */
  get rows(): DataSourceRow[] {
    if (this.#denseRows === undefined) {
      const rows: DataSourceRow[] = [];
      const count = Math.min(this.#rows.length, this.#size);
      for (let i = 0; i < count; i++) {
        const row = this.#rows[i];
        if (row !== undefined) {
          rows.push(row);
        }
      }
      this.#denseRows = rows;
    }
    return this.#denseRows;
  }

  get size() {
    return this.#size;
  }

  /**
   * Incremented on every change, can be used to cheaply detect changes.
   */
  get version() {
    return this.#version;
  }

  getValue(
    row: DataSourceRow,
    columnName: string,
  ): VuuRowDataItemType | undefined {
    const index = this.#columnMap[columnName];
    return index === undefined ? undefined : row[index];
  }

  subscribe() {
    if (!this.#subscribed) {
      this.#subscribed = true;
      this.#dataSource.subscribe(
        { range: Range(0, this.#maxRows) },
        this.handleData,
      );
    }
  }

  dispose() {
    if (this.#subscribed) {
      this.#subscribed = false;
      this.#dataSource.unsubscribe();
    }
    this.removeAllListeners();
    this.#rows = [];
    this.#denseRows = undefined;
    this.#size = 0;
  }

  private changed() {
    this.#denseRows = undefined;
    this.#version += 1;
    this.emit("update");
  }

  handleData: DataSourceSubscribeCallback = (message) => {
    if (!this.#subscribed) {
      return;
    }
    switch (message.type) {
      case "subscribed":
        if (message.columns) {
          this.#columnMap = buildColumnMap(message.columns);
        }
        break;
      case "viewport-update": {
        let changed = false;
        if (typeof message.size === "number" && message.size !== this.#size) {
          this.#size = message.size;
          if (this.#rows.length > message.size) {
            this.#rows.length = message.size;
          }
          changed = true;
        }
        if (message.mode !== "size-only" && message.rows) {
          for (const row of message.rows) {
            const index = row[IDX];
            if (index >= 0 && index < this.#maxRows) {
              this.#rows[index] = row;
              changed = true;
            }
          }
          // Some DataSources do not send a size with every row update.
          if (this.#size < this.#rows.length) {
            this.#size = this.#rows.length;
          }
        }
        if (changed) {
          this.changed();
        }
        break;
      }
      case "viewport-clear":
        this.#rows = [];
        this.#size = 0;
        this.changed();
        break;
      default:
    }
  };
}

/**
 * Manages one ChartDataStore per distinct DataSource instance.
 */
export class ChartDataStores {
  #stores = new Map<DataSource, ChartDataStore>();

  constructor(
    dataSources: DataSource[],
    options: ChartDataStoreOptions,
    onUpdate: () => void,
  ) {
    for (const dataSource of dataSources) {
      if (!this.#stores.has(dataSource)) {
        const store = new ChartDataStore(dataSource, options);
        store.on("update", onUpdate);
        this.#stores.set(dataSource, store);
      }
    }
  }

  get(dataSource: DataSource) {
    const store = this.#stores.get(dataSource);
    if (store === undefined) {
      throw Error(
        "[ChartDataStores] no store for DataSource. All DataSources must be declared to the chart",
      );
    }
    return store;
  }

  subscribe() {
    for (const store of this.#stores.values()) {
      store.subscribe();
    }
  }

  dispose() {
    for (const store of this.#stores.values()) {
      store.dispose();
    }
    this.#stores.clear();
  }
}
