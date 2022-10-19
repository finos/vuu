import { RemoteDataSource, SubscribeCallback } from "@vuu-ui/data-remote";
import { TypeaheadParams, VuuSortCol } from "@vuu-ui/data-types";
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
import { AgGridDataSet, convertToAgGridDataSet } from "./AgGridDataUtils";

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

export class AgGridViewportRowModelDataSource implements IViewportDatasource {
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
  getRow(rowIndex: number) {
    console.error(`getRow [${rowIndex}] called before init`);
  }
  setRowData(rows: AgGridDataSet) {
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
        const rows = convertToAgGridDataSet(message.rows);
        console.table(rows);

        this.setRowData(rows);
      } else if (message.size !== undefined) {
        console.log("got a size message");
      }
    }
  };

  /**
   * Invoked when the AgGrid menu panel is opened, whether
   * or not the Filter Tab is selected.
   */
  handleFilterOpened = (evt: FilterOpenedEvent) => {
    const { source, column } = evt;
    console.log(`filter Opened`, {
      source,
      column,
    });
  };

  /**
   *
   * Invoked when the value of a filter changes
   */
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

  /**
   * Invoked when we change the operator in the Filter Panel,
   * or type into the value input. Gets called even when
   * operator dropdown is clicked, before any selection is
   * made.
   */
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
