import {
  DataSource,
  DataSourceConfig,
  isVuuFeatureAction,
  SubscribeCallback,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import { Filter } from "@finos/vuu-filter-types";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";
import {
  buildColumnMap,
  ColumnMap,
  itemsOrOrderChanged,
  metadataKeys,
} from "@finos/vuu-utils";
import { AgDataWindow } from "./AgDataWindow";
import {
  AgVuuDataRow,
  convertToAgViewportRows,
  toAgViewportRow,
} from "./AgGridDataUtils";

const { IDX, IS_LEAF, IS_EXPANDED } = metadataKeys;
const NO_COLUMNS: string[] = [];

type AgRow = {
  data?: AgVuuDataRow;
  expanded?: boolean;
  setData: (data: AgVuuDataRow) => void;
  setDataValue: (field: string, value: string | number | boolean) => void;
  setExpanded: (value: boolean) => void;
  updateData: (data: AgVuuDataRow) => void;
};

const reverseColumnMap = (columnMap: ColumnMap): Map<number, string> =>
  new Map<number, string>(
    Object.entries(columnMap).map(
      (entry) => entry.reverse() as [number, string]
    )
  );

export interface IViewportDatasourceParams {
  setRowCount: (count: number, keepRenderedRows: boolean) => void;
  setRowData: (rowData: { [key: number]: any }) => void;
  getRow: (rowIndex: number) => AgRow;
}

/**
 * This is a custom ViewportRowModelDataSource that complies with the interface
 * expected by AgGrid. Internally, it interacts with a remote Vuu server to
 * fetch data. It wraps a Vuu RemoteDataSource.
 */
export class ViewportRowModelDataSource {
  private columns: string[];
  private columnMap: ColumnMap;
  private reverseColumnMap: Map<number, string>;

  private dataWindow: AgDataWindow = new AgDataWindow({ from: 0, to: 0 });

  constructor(
    private dataSource: DataSource,
    private onFeatureEnabled?: (message: VuuFeatureMessage) => void
  ) {
    this.dataSource.subscribe({}, this.handleMessageFromDataSource);
    // this.dataSource.on("config", this.handleConfigChange);

    this.columns = dataSource.columns;
    this.columnMap = buildColumnMap(dataSource.columns);
    this.reverseColumnMap = reverseColumnMap(this.columnMap);

    this.dataSource.on("config", this.handleDataSourceConfigChange);
  }

  destroy() {
    this.dataSource.removeListener("config", this.handleDataSourceConfigChange);
  }

  private handleDataSourceConfigChange = (
    config?: DataSourceConfig,
    confirmed?: boolean
  ) => {
    const columns = config?.columns ?? NO_COLUMNS;
    if (confirmed === undefined && Array.isArray(config?.columns)) {
      if (itemsOrOrderChanged(this.columns, columns)) {
        this.columns = columns;
        this.columnMap = buildColumnMap(columns);
      }
    }
  };

  setAgRowCount: IViewportDatasourceParams["setRowCount"] = () => {
    throw Error("setRowCount called before init");
  };

  getAgRow: IViewportDatasourceParams["getRow"] = (rowIndex: number) => {
    throw Error(`getRow [${rowIndex}] called before init`);
  };
  setAgRowData: IViewportDatasourceParams["setRowData"] = () => {
    throw Error("setRowData called before init");
  };

  init({ setRowData, setRowCount, getRow }: IViewportDatasourceParams): void {
    this.setAgRowCount = setRowCount;
    this.getAgRow = getRow;
    this.setAgRowData = setRowData;
  }

  // Called by Ag Grid whe  user scrolls
  setViewportRange(firstRow: number, lastRow: number): void {
    // we have sometimes seen a call coming in here from AgGrid
    // where lastRow is (much) less than firstRow.
    const safeLastRow = Math.max(firstRow, lastRow + 1);
    this.dataWindow.setRange(firstRow, safeLastRow);
    this.dataSource.range = { from: firstRow, to: safeLastRow };
  }

  setRowGroups(groupBy: VuuGroupBy) {
    this.dataSource.groupBy = groupBy;
    this.dataWindow.clear();
  }

  setExpanded(key: string, expanded: boolean) {
    if (expanded) {
      this.dataSource.closeTreeNode(key);
    } else {
      this.dataSource.openTreeNode(key);
    }
    this.dataWindow.clear();
  }

  filter(filterStruct: Filter | undefined, filter: string) {
    this.dataSource.filter = { filterStruct, filter };
  }

  sort(sort: VuuSort) {
    this.dataSource.sort = sort;
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.dataWindow.rowCount) {
          this.dataWindow.setRowCount(message.size);
          this.setAgRowCount(message.size, false);
        }
      }
      if (message.rows) {
        const { columnMap, reverseColumnMap } = this;
        if (message.mode === "update") {
          for (const dataRow of message.rows) {
            const {
              [IDX]: rowIndex,
              [IS_EXPANDED]: isExpanded,
              [IS_LEAF]: isLeaf,
            } = dataRow;
            const agRowNode = this.getAgRow(rowIndex);
            if (agRowNode.data) {
              const updates = this.dataWindow.update(dataRow, reverseColumnMap);
              if (updates) {
                for (let i = 0; i < updates.length; i += 2) {
                  agRowNode.setDataValue(updates[i] as string, updates[i + 1]);
                }
              }
            } else {
              const agVuuDataRow = toAgViewportRow(dataRow, columnMap);
              agRowNode.setData(agVuuDataRow);
            }

            if (!isLeaf) {
              if (isExpanded && !agRowNode.expanded) {
                agRowNode.setExpanded(true);
              }
            }
          }
        } else {
          const agRowData = convertToAgViewportRows(message.rows, columnMap);
          for (const dataRow of message.rows) {
            this.dataWindow.add(dataRow);
          }
          this.setAgRowData(agRowData);
        }
      }
    } else if (isVuuFeatureAction(message)) {
      this.onFeatureEnabled?.(message);
    }
  };
}
