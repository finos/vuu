import {
  DataSource,
  isViewportMenusAction,
  isVisualLinksAction,
  MenuActionConfig,
  MenuRpcResponse,
  SuggestionFetcher,
  useTypeaheadSuggestions,
  useVuuMenuActions,
  VuuFeatureMessage,
  VuuServerMenuOptions,
} from "@finos/vuu-data";
import { VuuMenu, VuuTable } from "@finos/vuu-protocol-types";
import { useCallback, useMemo, useRef } from "react";
import { bySortIndex, isSortedColumn, toSortDef } from "./AgGridDataUtils";

import {
  AgGridFilter,
  agGridFilterModelToVuuFilter,
} from "./AgGridFilterUtils";
import { FilterDataProvider } from "./FilterDataProvider";
import { GroupCellRenderer } from "./GroupCellRenderer";
import { ViewportRowModelDataSource } from "./ViewportRowModelDataSource";
import { buildColumnMap } from "@finos/vuu-utils";
import { vuuMenuToAgGridMenu } from "./agGridMenuUtils";
import { AgData, AgDataRow } from "./AgDataWindow";

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
  node: { expanded?: boolean };
};
type ColumnState = { colId: string; sortIndex: number }[];
type SortChangedEvent = {
  columnApi: {
    getColumnState: () => ColumnState;
  };
};

const NullSuggestionFetcher: SuggestionFetcher = async () => [];

export interface ViewportRowModelHookProps {
  dataSource: DataSource;
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
}

export const useViewportRowModel = ({
  dataSource,
  onFeatureEnabled,
}: ViewportRowModelHookProps) => {
  const menuRef = useRef<VuuMenu>();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    NullSuggestionFetcher
  );
  getTypeaheadSuggestionsRef.current = useTypeaheadSuggestions();

  // It is important that these values are not assigned in advance. They
  // are accessed at the point of construction of ContextMenu
  const menuActionConfig: MenuActionConfig = useMemo(
    () => ({
      get visualLink() {
        return undefined;
        // return load?.("visual-link") as DataSourceVisualLinkCreatedMessage;
      },
      get visualLinks() {
        return undefined;
        // return loadSession?.("vuu-links") as LinkDescriptorWithLabel[];
      },
      get vuuMenu() {
        return menuRef.current;
      },
    }),
    []
  );
  const handleRpcResponse = useCallback((response?: MenuRpcResponse) => {
    console.log(`what are we going to do with a MenuRPCResponse`, {
      response,
    });
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
    menuActionConfig,
    onRpcResponse: handleRpcResponse,
  });

  const handleVuuFeatureEnabled = useCallback(
    (message: VuuFeatureMessage) => {
      console.log("feature enabled", {
        message,
      });
      if (isViewportMenusAction(message)) {
        menuRef.current = message.menu;
      } else if (isVisualLinksAction(message)) {
        console.log("visual links received");
        // saveSession?.(message.links, "vuu-links");
      }
      onFeatureEnabled?.(message);
    },
    [onFeatureEnabled]
  );

  const viewportDatasource: ViewportRowModelDataSource = useMemo(() => {
    return new ViewportRowModelDataSource(dataSource, handleVuuFeatureEnabled);
  }, [dataSource, handleVuuFeatureEnabled]);

  const handleGridReady = useCallback(() => {
    // console.log("Grid Ready");
  }, []);

  const createFilterDataProvider = useCallback((table: VuuTable) => {
    return new FilterDataProvider(table, getTypeaheadSuggestionsRef);
  }, []);

  const handleColumnRowGroupChanged = useCallback(
    (evt: unknown) => {
      const columnRowGroupChangedEvent = evt as ColumnRowGroupChangedEvent;
      const { columns } = columnRowGroupChangedEvent;
      if (columns !== null) {
        const colIds = columns.map((c) => c.getId());
        viewportDatasource.setRowGroups(colIds);
      }
    },
    [viewportDatasource]
  );

  const handleRowGroupOpened = useCallback(
    (evt: RowGroupOpenedEvent) => {
      const { groupKey } = evt.data;
      const { expanded = false } = evt.node;
      viewportDatasource.setExpanded(groupKey, !expanded);
    },
    [viewportDatasource]
  );

  const handleSortChanged = useCallback(
    (evt: unknown) => {
      const sortChangedEvent = evt as SortChangedEvent;
      const columnState = sortChangedEvent.columnApi.getColumnState();
      const sortDefs = columnState
        .filter(isSortedColumn)
        .sort(bySortIndex)
        .map(toSortDef);
      viewportDatasource.sort({ sortDefs: sortDefs });
    },
    [viewportDatasource]
  );

  const handleFilterChanged = useCallback(
    (evt: unknown) => {
      const filterChangedEvent = evt as FilterChangedEvent;
      const filterModel = filterChangedEvent.api.getFilterModel();
      const [filterQuery, vuuFilter] =
        agGridFilterModelToVuuFilter(filterModel);
      viewportDatasource.filter(vuuFilter, filterQuery);
    },
    [viewportDatasource]
  );

  const menuHandler = useCallback(
    (field: string, row: AgData) => (options?: { [key: string]: unknown }) => {
      handleMenuAction("MENU_RPC_CALL", {
        ...options,
        row,
        rowKey: row.vuuKey,
      });
      console.log("menu action invoked", {
        options,
        field,
        row,
      });
    },
    [handleMenuAction]
  );

  const getContextMenuItems = useCallback(
    ({ column, node }) => {
      const {
        colDef: { field },
      } = column;
      const { data } = node;
      console.log({ field, data });

      if (dataSource && dataSource.viewport) {
        const columnMap = buildColumnMap(dataSource.columns);
        const options: VuuServerMenuOptions = {
          columnMap,
          columnName: field,
          row: data,
          selectedRows: [],
          viewport: dataSource.viewport,
        };
        const menuOptions = buildViewserverMenuOptions("grid", options);
        console.log({ menuOptions });
        if (menuOptions.length > 0) {
          return menuOptions.map(vuuMenuToAgGridMenu(menuHandler(field, data)));
        }
      }

      return ["copy", "copyWithHeaders", "copyWithGroupHeaders"];
    },
    [buildViewserverMenuOptions, dataSource, menuHandler]
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
    getContextMenuItems,
    onColumnRowGroupChanged: handleColumnRowGroupChanged,
    onFilterChanged: handleFilterChanged,
    onGridReady: handleGridReady,
    onRowGroupOpened: handleRowGroupOpened,
    onSortChanged: handleSortChanged,
    rowModelType: "viewport" as const,
    rowSelection: "single" as const,
  };
};
