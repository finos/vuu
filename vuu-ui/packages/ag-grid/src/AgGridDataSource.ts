import {
  RemoteDataSource,
  SubscribeCallback,
  VuuUIRow,
} from "@vuu-ui/data-remote";
import { TypeaheadParams, VuuRow, VuuSortCol } from "@vuu-ui/data-types";
import {
  ColumnState,
  FilterChangedEvent,
  FilterModifiedEvent,
  FilterOpenedEvent,
  IViewportDatasource,
  IViewportDatasourceParams,
  SetFilterValuesFuncParams,
  SortChangedEvent,
} from "ag-grid-community";
import { SuggestionFetcher } from "@vuu-ui/data-remote";
import { MutableRefObject } from "react";
import { agGridFilterModelToVuuFilter } from "./AgGridFilterUtils";

const isSortedColumn = ({ sortIndex }: ColumnState) =>
  typeof sortIndex === "number";
const toSortDef = ({ colId: column, sort }: ColumnState): VuuSortCol => ({
  column,
  sortType: sort === "desc" ? "D" : "A",
});
const bySortIndex = (
  { sortIndex: s1 }: ColumnState,
  { sortIndex: s2 }: ColumnState
) => s1 - s2;

const convertToAgGrid = (rows: VuuRow[]) => {
  console.log({ rows });
  const result = {};
  rows.forEach((row) => {
    const [rowIdx] = row;
    result[rowIdx] = toAgGridRow(row);
  });
  return result;
};

const toAgGridRow = (data: VuuUIRow) => {
  return {
    bbg: data[8],
    currency: data[9],
    description: data[10],
    exchange: data[11],
    isin: data[12],
    lotSize: data[13],
    ric: data[14],
  };
};

export class AgGridViewportDataSource implements IViewportDatasource {
  private rowCount: number = -1;

  constructor(
    private dataSource: RemoteDataSource,
    private getSuggestions: MutableRefObject<SuggestionFetcher>
  ) {
    this.dataSource.subscribe(
      {
        range: { from: 0, to: 0 },
      },
      this.handleMessageFromDataSource
    );
  }

  setRowCount(count: number) {
    console.error("setRowCount called before init");
  }
  getRow() {
    console.error("getRow called before init");
  }
  setRowData() {
    console.error("setRowData called before init");
  }

  init({ setRowData, setRowCount, getRow }: IViewportDatasourceParams): void {
    console.log("init", {});

    this.setRowCount = setRowCount;
    this.getRow = getRow;
    this.setRowData = setRowData;
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    this.dataSource.setRange(firstRow, lastRow);
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "subscribed") {
      console.log(`subscribed`, {
        message,
      });
    } else if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.rowCount) {
          this.rowCount = message.size;
          this.setRowCount(message.size);
        }
      }
      if (message.rows) {
        const rows = convertToAgGrid(message.rows);
        this.setRowData(rows);
      } else if (message.size !== undefined) {
        console.log("got a size message");
      }
    } else {
      console.log(`message from server ${message.type}`);
    }
  };

  handleFilterOpened = (evt: FilterOpenedEvent) => {
    const { source, column } = evt;
    console.log(`filter Opened`, {
      source,
      column,
    });
  };

  handleFilterChanged = (evt: FilterChangedEvent) => {
    console.log(`handleFilterChanged`, {
      evt,
    });
    const filterModel = evt.api.getFilterModel();
    console.log({ filterModel });
    const [filterQuery, vuuFilter] = agGridFilterModelToVuuFilter(filterModel);
    console.log(`filterQuery '${filterQuery}'`, {
      vuuFilter,
    });
    this.dataSource.filter(vuuFilter, filterQuery);
    // const columnState = evt.columnApi.getColumnState();
    // console.log({ columnState });
    // const sortDefs = columnState
    //   .filter(isSortedColumn)
    //   .sort(bySortIndex)
    //   .map(toSortDef);
    // this.dataSource.sort(sortDefs);
  };

  handleFilterModified = (evt: FilterModifiedEvent) => {
    console.log(`filterModified`, {
      evt,
    });
    // const columnState = evt.columnApi.getColumnState();
    // console.log({ columnState });
    // const sortDefs = columnState
    //   .filter(isSortedColumn)
    //   .sort(bySortIndex)
    //   .map(toSortDef);
    // this.dataSource.sort(sortDefs);
  };

  handleSortChanged = (evt: SortChangedEvent) => {
    const columnState = evt.columnApi.getColumnState();
    const sortDefs = columnState
      .filter(isSortedColumn)
      .sort(bySortIndex)
      .map(toSortDef);
    this.dataSource.sort(sortDefs);
  };

  getSetFilterData = (params: SetFilterValuesFuncParams) => {
    const { colDef, column } = params;
    const vuuParams = [
      { module: "SIMUL", table: "instruments" },
      colDef.field,
    ] as TypeaheadParams;

    console.log("get set filter data", {
      params,
    });
    return this.getSuggestions.current(vuuParams);
  };
}
