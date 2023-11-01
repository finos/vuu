import {
  DataSourceConfig,
  isViewportMenusAction,
  isVisualLinksAction,
  MenuRpcResponse,
  RemoteDataSource,
  VuuFeatureMessage,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data";

import {
  MenuActionConfig,
  SuggestionFetcher,
  useTypeaheadSuggestions,
  useVuuMenuActions,
  VuuMenuActionHandler,
  VuuServerMenuOptions,
} from "@finos/vuu-data-react";

import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy, VuuMenu, VuuTable } from "@finos/vuu-protocol-types";
import { buildColumnMap, itemsOrOrderChanged } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgData } from "./AgDataWindow";
import {
  AgGridColDef,
  columnsDisordered,
  createColumnDefs,
} from "./AgGridColumnUtils";
import {
  bySortIndex,
  isSortedColumn,
  toSortDef,
  toVuuDataSourceRow,
} from "./AgGridDataUtils";
import {
  AgGridFilter,
  agGridFilterModelToVuuFilter,
} from "./AgGridFilterUtils";
import { vuuMenuToAgGridMenu } from "./agGridMenuUtils";
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

export interface AgGridDataRow {
  [key: string]: unknown;
  expanded?: boolean;
  groupKey: string;
  groupKeys?: string;
  groupRow: boolean;
}

const isAgGridGroupDataRow = (data: unknown): data is AgGridDataRow =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as AgGridDataRow)["groupKey"] === "string";

type RowGroupOpenedEvent = {
  data?: AgGridDataRow;
  expanded: boolean;
  node: { expanded?: boolean };
};

const NullSuggestionFetcher: SuggestionFetcher = async () => [];

export type AgColumnState = { colId: string; sortIndex: number }[];
export type AgSortChangedEvent = {
  columnApi: {
    getColumnState: () => AgColumnState;
  };
};

export const agSortChangedEventToVuuSortDef = (evt: AgSortChangedEvent) => {
  const columnState = evt.columnApi.getColumnState();
  return columnState.filter(isSortedColumn).sort(bySortIndex).map(toSortDef);
};

export interface ViewportRowModelHookProps {
  columns?: ColumnDescriptor[];
  dataSource: RemoteDataSource;
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  onRpcResponse?: (
    response:
      | MenuRpcResponse
      | VuuUIMessageInRPCEditReject
      | VuuUIMessageInRPCEditResponse
  ) => void;
  vuuMenuActionHandler?: VuuMenuActionHandler;
}

type GroupByConfigChange = {
  groupBy: VuuGroupBy;
};

const hasGroupByChange = (
  message?: Partial<DataSourceConfig>
): message is GroupByConfigChange => Array.isArray(message?.groupBy);

export const useViewportRowModel = ({
  columns,
  dataSource,
  onRpcResponse,
  onFeatureEnabled,
  vuuMenuActionHandler,
}: ViewportRowModelHookProps) => {
  const menuRef = useRef<VuuMenu>();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    NullSuggestionFetcher
  );
  const groupByRef = useRef<VuuGroupBy>([]);
  const [groupBy, setGroupBy] = useState<VuuGroupBy>(groupByRef.current);
  getTypeaheadSuggestionsRef.current = useTypeaheadSuggestions();

  const { table } = dataSource;

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
  const handleRpcResponse = useCallback(
    (
      response:
        | MenuRpcResponse
        | VuuUIMessageInRPCEditReject
        | VuuUIMessageInRPCEditResponse
    ) => {
      onRpcResponse?.(response);
    },
    [onRpcResponse]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    clientSideMenuActionHandler: vuuMenuActionHandler,
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
    // TODO call destroy on the dataSource when we dispose of it
    return new ViewportRowModelDataSource(dataSource, handleVuuFeatureEnabled);
  }, [dataSource, handleVuuFeatureEnabled]);

  const handleGridReady = useCallback(() => {
    // console.log("Grid Ready");
  }, []);

  const createFilterDataProvider = useCallback((table: VuuTable) => {
    return new FilterDataProvider(table, getTypeaheadSuggestionsRef);
  }, []);

  const columnDefs = useMemo(() => {
    return Array.isArray(columns)
      ? createColumnDefs(createFilterDataProvider(table), columns, groupBy)
      : undefined;
  }, [columns, createFilterDataProvider, groupBy, table]);

  useEffect(() => {
    // We listen to dsataSource config changes to detect changes applied
    // directly to the dataSource, i.e. not applied via AgGrid and detected via
    // AgGrid event callbacks. For the former, AgGrid has no knowledge
    // that a change has occurred, so will not render the subsequent row refresh
    // correctly. In the case of GroupBy, for example. we need to recompute the
    // column defs to apply grouping. This will cause AgGrid to re-render columns
    // taking grouping into account and will enable subsequent refresh of grouped
    // data to be handled correctly.
    // Where a config change DOES originate from AgGrid (e.g user has applied
    // grouping from the Ag Grid context menu), we store latest value in a ref,
    // so that we can ignore the config change event(s) that will be fired by
    // the dataSource for this config change.
    dataSource.on("config", (config) => {
      if (
        hasGroupByChange(config) &&
        itemsOrOrderChanged(groupByRef.current, config.groupBy)
      ) {
        setGroupBy(config.groupBy);
      }
    });
  }, [dataSource]);

  // Fired when user has applied grouping from AG Grid, either via the
  // column menu or by dragging a column onto the group bar.
  const handleColumnRowGroupChanged = useCallback(
    (evt: unknown) => {
      const columnRowGroupChangedEvent = evt as ColumnRowGroupChangedEvent;
      const { columns } = columnRowGroupChangedEvent;
      if (columns !== null) {
        const vuuGroupBy: VuuGroupBy = columns.map((c) => c.getId());
        groupByRef.current = vuuGroupBy;
        console.log(`set GroupBy in respponse to ag grid event`);
        viewportDatasource.setRowGroups(vuuGroupBy);
      }
    },
    [viewportDatasource]
  );

  const handleRowGroupOpened = useCallback(
    (evt: RowGroupOpenedEvent) => {
      if (isAgGridGroupDataRow(evt.data)) {
        const { groupKey } = evt.data;
        const { expanded = false } = evt.node;
        viewportDatasource.setExpanded(groupKey, !expanded);
      }
    },
    [viewportDatasource]
  );

  const handleSortChanged = useCallback(
    (evt: unknown) => {
      const sortDefs = agSortChangedEventToVuuSortDef(
        evt as AgSortChangedEvent
      );
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
      handleMenuAction({
        menuId: "MENU_RPC_CALL",
        options: {
          ...options,
          row,
          rowKey: row.vuuKey,
        },
        type: "menu-action",
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
      const data = node.data as AgData;
      console.log({ field, data });

      if (dataSource && dataSource.viewport) {
        // We have to convert the Ag style row (map) to a Vuu style row (array)
        // to support Vuu filter evaulation against rows
        const columnMap = buildColumnMap(dataSource.columns);
        const options: VuuServerMenuOptions = {
          columnMap,
          columnName: field,
          row: toVuuDataSourceRow(data, columnMap),
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

  const autoGroupColumnDef: AgGridColDef = useMemo(
    () => ({
      headerName: "Group",
      cellRenderer: GroupCellRenderer,
      minWidth: 250,
      sortable: false,
    }),
    []
  );

  const handleGridColumnsChanged = useCallback((evt) => {
    const allColumns = evt.columnApi.getAllColumns();
    const colDefs = allColumns.map(
      (col: { colDef: AgGridColDef }) => col.colDef
    );
    const colState = evt.columnApi.getColumnState();
    // An issue we see when switching dataSource is that AgGrid changes the
    // position of columns which appear in both original and new table.
    // Resetting the state when we detect this scenario fixes.
    if (columnsDisordered(colState, colDefs)) {
      evt.columnApi.resetColumnState();
    }
  }, []);

  return {
    autoGroupColumnDef,
    columnDefs,
    createFilterDataProvider,
    viewportDatasource,
    defaultColDef: {
      resizable: true,
      sortable: true,
    },
    getContextMenuItems,
    onColumnRowGroupChanged: handleColumnRowGroupChanged,
    onFilterChanged: handleFilterChanged,
    onGridColumnsChanged: handleGridColumnsChanged,
    onGridReady: handleGridReady,
    onRowGroupOpened: handleRowGroupOpened,
    onSortChanged: handleSortChanged,
    rowModelType: "viewport" as const,
    rowSelection: "single" as const,
  };
};
