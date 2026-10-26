import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import type { FilterState } from "@vuu-ui/vuu-filter-types";
import type { FilterBarProps, FilterMode } from "@vuu-ui/vuu-filters";
import { useTableConfig } from "@vuu-ui/vuu-table";
import {
  DataSourceStats,
  TabbedTableSettingsAction,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import type {
  TableConfig,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import { ContextPanelProvider } from "@vuu-ui/vuu-ui-controls";
import { applyDefaultColumnConfig, useShellContext } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  useContextPanel,
  useHideContextPanel,
} from "../context-panel/ContextPanelProvider";

/** The table display defaults of a FilterTable. */
export const FILTER_TABLE_DEFAULT_CONFIG: Partial<TableConfig> = {
  columnDefaultWidth: 130,
  columnLayout: "fit",
  rowSeparators: true,
  zebraStripes: true,
};

/** What a FilterTable saves of its state, as `tableState` of its item. */
export interface VuuFilterTableState {
  config?: TableConfig;
  filterMode?: FilterMode;
  filterState?: FilterState;
  quickFilterColumns?: string[];
}

export interface VuuFilterTableViewProps {
  className?: string;
  dataSource: DataSource;
  /** Merged into the saved state of the item. */
  onStateChange: (state: Partial<VuuFilterTableState>) => void;
  /** The saved state, read when the view mounts. */
  savedState?: VuuFilterTableState;
  schema: TableSchema;
}

const NO_FILTERS: FilterState = { activeIndices: [], filters: [] };

/**
 * A Vuu table with a filter bar above it and a footer below: row counts
 * (DataSourceStats) and the table settings. Changes to columns, filters and
 * filter mode are reported with `onStateChange`, to be saved with the item.
 */
const VuuFilterTableView = ({
  className,
  dataSource,
  onStateChange,
  savedState,
  schema,
}: VuuFilterTableViewProps) => {
  // Read once: later changes come from the table and filter bar themselves.
  const saved = useRef(savedState).current;
  const { getDefaultColumnConfig, handleRpcResponse } = useShellContext();

  const initialConfig = useMemo<TableConfig>(
    () => ({
      ...FILTER_TABLE_DEFAULT_CONFIG,
      ...saved?.config,
      columns:
        saved?.config?.columns ??
        applyDefaultColumnConfig(schema, getDefaultColumnConfig),
    }),
    [getDefaultColumnConfig, saved, schema],
  );

  const handleConfigChange = useCallback<TableConfigChangeHandler>(
    (config) => onStateChange({ config }),
    [onStateChange],
  );

  const { columnModel, onTableDisplayAttributeChange, tableConfig } =
    useTableConfig({
      availableColumns: schema.columns,
      config: initialConfig,
      dataSource,
      onTableConfigChange: handleConfigChange,
    });

  const [filterState, setFilterState] = useState<FilterState>(
    saved?.filterState ?? NO_FILTERS,
  );
  const [quickFilterColumns, setQuickFilterColumns] = useState<string[]>(
    saved?.quickFilterColumns ?? [],
  );

  const handleFilterStateChanged = useCallback(
    (nextFilterState: FilterState) => {
      setFilterState(nextFilterState);
      onStateChange({ filterState: nextFilterState });
    },
    [onStateChange],
  );
  const handleChangeFilterMode = useCallback(
    (filterMode: FilterMode) => onStateChange({ filterMode }),
    [onStateChange],
  );
  const handleChangeQuickFilterColumns = useCallback(
    (columns: string[]) => {
      setQuickFilterColumns(columns);
      onStateChange({ quickFilterColumns: columns });
    },
    [onStateChange],
  );

  const filterBarProps: Partial<FilterBarProps> = {
    QuickFilterProps: {
      onChangeQuickFilterColumns: handleChangeQuickFilterColumns,
      quickFilterColumns,
    },
    columnDescriptors: tableConfig.columns,
    defaultFilterMode: saved?.filterMode,
    filterState,
    onChangeFilterMode: handleChangeFilterMode,
    onFilterStateChanged: handleFilterStateChanged,
    vuuTable: schema.table,
  };

  const { menuActionHandler, menuBuilder } = useVuuMenuActions({
    dataSource,
    onRpcResponse: handleRpcResponse,
  });

  // Table settings open in the portal's context panel.
  const showContextPanel = useContextPanel();
  const hideContextPanel = useHideContextPanel();

  return (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
    >
      <ContextPanelProvider
        hideContextPanel={hideContextPanel}
        showContextPanel={showContextPanel}
      >
        <div className={className}>
          <FilterTable
            FilterBarProps={filterBarProps}
            TableProps={{
              config: tableConfig,
              dataSource,
              onConfigChange: handleConfigChange,
              renderBufferSize: 20,
              rowSelectionBorder: true,
            }}
            style={{ flex: "1 1 auto", minHeight: 0 }}
          />
          <TableFooter>
            <DataSourceStats dataSource={dataSource} />
            <TableFooterTray>
              <TabbedTableSettingsAction
                allowCreateCalculatedColumn
                columnModel={columnModel}
                config={tableConfig}
                data-embedded
                onDisplayAttributeChange={onTableDisplayAttributeChange}
                vuuTable={schema.table}
              />
            </TableFooterTray>
          </TableFooter>
        </div>
      </ContextPanelProvider>
    </ContextMenuProvider>
  );
};

export default VuuFilterTableView;
