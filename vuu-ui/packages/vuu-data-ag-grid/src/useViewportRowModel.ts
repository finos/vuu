import {
  DataSourceConfig,
  MenuRpcResponse,
  RemoteDataSource,
  VuuFeatureMessage,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data";

import {
  isViewportMenusAction,
  isVisualLinksAction,
  MenuActionConfig,
  SuggestionFetcher,
  useTypeaheadSuggestions,
  useVuuMenuActions,
  VuuServerMenuOptions,
} from "@finos/vuu-data-react";

import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy, VuuMenu, VuuTable } from "@finos/vuu-protocol-types";
import { buildColumnMap, itemsOrOrderChanged } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgData } from "./AgDataWindow";
import { createColumnDefs } from "./AgGridColumnUtils";
import { bySortIndex, isSortedColumn, toSortDef } from "./AgGridDataUtils";
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
type ColumnState = { colId: string; sortIndex: number }[];
type SortChangedEvent = {
  columnApi: {
    getColumnState: () => ColumnState;
  };
};

const NullSuggestionFetcher: SuggestionFetcher = async () => [];

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
    onGridReady: handleGridReady,
    onRowGroupOpened: handleRowGroupOpened,
    onSortChanged: handleSortChanged,
    rowModelType: "viewport" as const,
    rowSelection: "single" as const,
  };
};
