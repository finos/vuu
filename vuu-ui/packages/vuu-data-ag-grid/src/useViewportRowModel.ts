import {
  DataSourceProps,
  SuggestionFetcher,
  useViewserver,
} from "@finos/vuu-data";
import { VuuTable } from "@finos/vuu-protocol-types";
import {
  ColumnRowGroupChangedEvent,
  FilterChangedEvent,
  RowGroupOpenedEvent,
  SortChangedEvent,
} from "ag-grid-community";
import { useCallback, useMemo, useRef } from "react";
import { bySortIndex, isSortedColumn, toSortDef } from "./AgGridDataUtils";
import { agGridFilterModelToVuuFilter } from "./AgGridFilterUtils";
import { FilterDataProvider } from "./FilterDataProvider";
import { GroupCellRenderer } from "./GroupCellRenderer";
import { ViewportRowModelDataSource } from "./ViewportRowModelDataSource";

export const useViewportRowModel = (config: DataSourceProps) => {
  const { getTypeaheadSuggestions } = useViewserver();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    getTypeaheadSuggestions
  );

  const dataSource: ViewportRowModelDataSource = useMemo(() => {
    return new ViewportRowModelDataSource(config);
  }, [config]);

  const handleGridReady = useCallback(() => {
    console.log("Grid Ready");
  }, []);

  const createFilterDataProvider = useCallback((table: VuuTable) => {
    return new FilterDataProvider(table, getTypeaheadSuggestionsRef);
  }, []);

  const handleColumnRowGroupChanged = useCallback(
    (evt: ColumnRowGroupChangedEvent) => {
      console.log({ evt });
      const { columns } = evt;
      if (columns !== null) {
        const colIds = columns.map((c) => c.getId());
        // const valueCols = evt.columnApi
        //   .getValueColumns()
        //   .map((c) => ({ aggFunc: c.getAggFunc(), id: c.getId() }));
        dataSource.setRowGroups(colIds);
      }
    },
    [dataSource]
  );

  const handleRowGroupOpened = useCallback(
    (evt: RowGroupOpenedEvent) => {
      const { expanded, groupKey } = evt.data;
      dataSource.setExpanded(groupKey, expanded);
    },
    [dataSource]
  );

  const handleSortChanged = useCallback(
    (evt: SortChangedEvent) => {
      const columnState = evt.columnApi.getColumnState();
      const sortDefs = columnState
        .filter(isSortedColumn)
        .sort(bySortIndex)
        .map(toSortDef);
      dataSource.sort(sortDefs);
    },
    [dataSource]
  );

  const handleFilterChanged = useCallback(
    (evt: FilterChangedEvent) => {
      const filterModel = evt.api.getFilterModel();
      const [filterQuery, vuuFilter] =
        agGridFilterModelToVuuFilter(filterModel);
      dataSource.filter(vuuFilter, filterQuery);
    },
    [dataSource]
  );

  const autoGroupColumnDef = {
    headerName: "Group",
    cellRenderer: GroupCellRenderer,
    minWidth: 250,
  };

  return {
    autoGroupColumnDef,
    // cacheBlockSize: 100,
    createFilterDataProvider,
    viewportDatasource: dataSource,
    defaultColDef: {
      sortable: true,
    },
    // maxBlocksInCache: 1,
    onColumnRowGroupChanged: handleColumnRowGroupChanged,
    onFilterChanged: handleFilterChanged,
    onGridReady: handleGridReady,
    onRowGroupOpened: handleRowGroupOpened,
    onSortChanged: handleSortChanged,
    // purgeClosedRowNodes: true,
    rowModelType: "viewport",
    rowSelection: "single",
    // serverSideInfiniteScroll: true,
    // serverSideStoreType: "partial",
  };
};
