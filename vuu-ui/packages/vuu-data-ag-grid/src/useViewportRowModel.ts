import {
  DataSource,
  SuggestionFetcher,
  useTypeaheadSuggestions,
} from "@finos/vuu-data";
import { VuuTable } from "@finos/vuu-protocol-types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { bySortIndex, isSortedColumn, toSortDef } from "./AgGridDataUtils";
import {
  AgGridFilter,
  agGridFilterModelToVuuFilter,
} from "./AgGridFilterUtils";
import { FilterDataProvider } from "./FilterDataProvider";
import { GroupCellRenderer } from "./GroupCellRenderer";
import { ViewportRowModelDataSource } from "./ViewportRowModelDataSource";

type Column = {
  getId: () => string;
};
type ColumnRowGroupChangedEvent = {
  columns: Column[];
};
interface FilterChangedEvent {
  api: {
    getFilterModel: () => AgGridFilter;
  };
}
type RowGroupOpenedEvent = {
  data: {
    expanded: boolean;
    groupKey: string;
  };
};
type ColumnState = { colId: string; sortIndex: number }[];
type SortChangedEvent = {
  columnApi: {
    getColumnState: () => ColumnState;
  };
};

const NullSuggestionFetcher: SuggestionFetcher = async () => [];

export const useViewportRowModel = (dataSource: DataSource) => {
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    NullSuggestionFetcher
  );
  getTypeaheadSuggestionsRef.current = useTypeaheadSuggestions();

  const viewportDatasource: ViewportRowModelDataSource = useMemo(() => {
    return new ViewportRowModelDataSource(dataSource);
  }, [dataSource]);

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
        viewportDatasource.setRowGroups(colIds);
      }
    },
    [viewportDatasource]
  );

  const handleRowGroupOpened = useCallback(
    (evt: RowGroupOpenedEvent) => {
      const { expanded, groupKey } = evt.data;
      viewportDatasource.setExpanded(groupKey, expanded);
    },
    [viewportDatasource]
  );

  const handleSortChanged = useCallback(
    (evt: SortChangedEvent) => {
      const columnState = evt.columnApi.getColumnState();
      const sortDefs = columnState
        .filter(isSortedColumn)
        .sort(bySortIndex)
        .map(toSortDef);
      viewportDatasource.sort({ sortDefs: sortDefs });
    },
    [viewportDatasource]
  );

  const handleFilterChanged = useCallback(
    (evt: FilterChangedEvent) => {
      const filterModel = evt.api.getFilterModel();
      const [filterQuery, vuuFilter] =
        agGridFilterModelToVuuFilter(filterModel);
      viewportDatasource.filter(vuuFilter, filterQuery);
    },
    [viewportDatasource]
  );

  const autoGroupColumnDef = {
    headerName: "Group",
    cellRenderer: GroupCellRenderer,
    minWidth: 250,
  };

  return {
    autoGroupColumnDef,
    createFilterDataProvider,
    viewportDatasource,
    defaultColDef: {
      sortable: true,
    },
    onColumnRowGroupChanged: handleColumnRowGroupChanged,
    onFilterChanged: handleFilterChanged,
    onGridReady: handleGridReady,
    onRowGroupOpened: handleRowGroupOpened,
    onSortChanged: handleSortChanged,
    rowModelType: "viewport" as const,
    rowSelection: "single" as const,
  };
};
