import {
  DataSource,
  isVuuFeatureAction,
  SubscribeCallback,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import { buildColumnMap, ColumnMap, metadataKeys } from "@finos/vuu-utils";
import { AgViewportRows, convertToAgViewportRows } from "./AgGridDataUtils";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filter-types";
import { AgDataWindow } from "./AgDataWindow";

const { IDX, IS_LEAF, IS_EXPANDED } = metadataKeys;

type AgRow = {
  expanded?: boolean;
  setDataValue: (field: string, value: string | number | boolean) => void;
  setExpanded: (value: boolean) => void;
};

type IViewportDatasourceParams = {
  getRow: (rowIndex: number) => AgRow;
  setRowCount: (rowCount: number) => void;
  setRowData: (data: AgViewportRows) => void;
};

const reverseColumnMap = (columnMap: ColumnMap): Map<number, string> =>
  new Map<number, string>(
    Object.entries(columnMap).map(
      (entry) => entry.reverse() as [number, string]
    )
  );

export class ViewportRowModelDataSource {
  private columnMap: ColumnMap;
  private reverseColumnMap: Map<number, string>;

  private dataWindow: AgDataWindow = new AgDataWindow({ from: 0, to: 0 });

  constructor(
    private dataSource: DataSource,
    private onFeatureEnabled?: (message: VuuFeatureMessage) => void
  ) {
    this.dataSource.subscribe({}, this.handleMessageFromDataSource);
    this.columnMap = buildColumnMap(dataSource.columns);
    this.reverseColumnMap = reverseColumnMap(this.columnMap);
  }

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
    this.dataWindow.setRange(firstRow, lastRow + 1);
    this.dataSource.range = { from: firstRow, to: lastRow + 1 };
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
          this.setAgRowCount(message.size);
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
            const updates = this.dataWindow.update(dataRow, reverseColumnMap);
            const agRowNode = this.getAgRow(rowIndex);

            if (updates) {
              for (let i = 0; i < updates.length; i += 2) {
                agRowNode.setDataValue(updates[i] as string, updates[i + 1]);
              }
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
        console.log(
          `%csetAgRowData  ${message.rows[0][0]} - ${
            message.rows[message.rows.length - 1][0]
          }`,
          "color: green; font-weight: bold;"
        );
        this.setAgRowData(agRowData);
        // }
      }
    } else if (isVuuFeatureAction(message)) {
      this.onFeatureEnabled?.(message);
    }
  };
}
