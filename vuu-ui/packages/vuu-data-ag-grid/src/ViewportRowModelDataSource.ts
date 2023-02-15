import { DataSource, SubscribeCallback } from "@finos/vuu-data";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { AgViewportRows, convertToAgViewportRows } from "./AgGridDataUtils";
import { VuuGroupBy, VuuSort } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filter-types";
import { AgDataWindow } from "./AgDataWindow";

type AgRow = {
  setDataValue: (field: string, value: string | number | boolean) => void;
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

// const log = (message: string, ...rest: unknown[]) =>
//   console.log(
//     `%c[ViewportDataSource] ${message}`,
//     "color: blue;font-weight: bold;",
//     ...rest
//   );

export class ViewportRowModelDataSource {
  private columnMap: ColumnMap;
  private reverseColumnMap: Map<number, string>;

  private dataWindow: AgDataWindow = new AgDataWindow({ from: 0, to: 0 });

  constructor(private dataSource: DataSource) {
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
    //------------
    const d = this.dataWindow.data;
    console.log(
      `%csetViewport Range called by Ag Grid ${firstRow} - ${lastRow}
      dataWindow contains ${d[0]?.[0]} - ${d[d.length - 1]?.[0]}
      `,
      "color:green;font-weight:bold;"
    );
    //-------------
    this.dataWindow.setRange(firstRow, lastRow + 1);
    this.dataSource.range = { from: firstRow, to: lastRow + 1 };
  }

  setRowGroups(groupBy: VuuGroupBy) {
    // console.log(`roupBy ${groupBy.join(",")}`);
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
        //----------------
        const d = this.dataWindow.data;
        console.log(`ViewportRowModelDataSource ${
          message.rows.length
        } received rows
          ${message.rows[0][0]} - ${message.rows[message.rows.length - 1][0]}  
          dataWindow contains ${d[0]?.[0]} - ${d[d.length - 1]?.[0]}
        `);
        if (message.mode === "update") {
          console.log("update path");
          for (const dataRow of message.rows) {
            const [rowIndex] = dataRow;
            const updates = this.dataWindow.update(dataRow, reverseColumnMap);
            if (updates) {
              const agRowNode = this.getAgRow(rowIndex);
              for (let i = 0; i < updates.length; i += 2) {
                agRowNode.setDataValue(updates[i] as string, updates[i + 1]);
              }
            }
          }
        } else {
          console.log("insert path");
          const agRowData = convertToAgViewportRows(message.rows, columnMap);
          for (const dataRow of message.rows) {
            this.dataWindow.add(dataRow);
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
      }
    }
  };
}
