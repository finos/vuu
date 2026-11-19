import { Text } from "@salt-ds/core";
import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ContextPanelColumnsPicker,
  FilterBar,
  QuickFilterColumnsPicker,
} from "@vuu-ui/vuu-filters";
import { Table, useTableConfig } from "@vuu-ui/vuu-table";
import {
  ColumnModel,
  ColumnPicker,
  type ColumnSetsState,
  ColumnSetSwitcher,
  ConfigPanelTab,
  DataSourceStats,
  getActiveColumnSetColumns,
  TabbedConfigPanel,
  TableFooter,
  TableFooterTray,
  useColumnSetModel,
} from "@vuu-ui/vuu-table-extras";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import {
  IconButton,
  type ItemDescriptor,
  useContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { DemoTableContainer } from "../Table/DemoTableContainer";

const schema = getSchema("instrumentsExtended");

const watchlistColumns = ["ric", "description", "currency", "exchange"];
const columnSets: ColumnSetsState = {
  activeColumnSet: "Watchlist",
  columnSets: [
    {
      name: "Watchlist",
      columns: watchlistColumns,
      savedColumns: watchlistColumns,
    },
    {
      name: "Screening",
      columns: ["ric", "description", "price", "lotSize"],
      savedColumns: ["ric", "description", "price", "lotSize"],
    },
  ],
};

const DEFAULT_QUICK_FILTER_COLUMNS = ["currency", "exchange"];

const quickFilterItems: ItemDescriptor[] = schema.columns.map(({ name }) => ({
  label: name,
  name,
}));

const toItems = (names: string[]) =>
  names
    .map((name) => quickFilterItems.find((item) => item.name === name))
    .filter((item): item is ItemDescriptor => item !== undefined);

/**
 * A TabbedConfigPanel with the tabs a host chooses: here a column picker
 * and the quick filter fields. A field can be a quick filter without being
 * a column.
 */
export const ColumnsAndQuickFilters = () => {
  const columnModel = useMemo(
    () =>
      new ColumnModel(
        schema.columns,
        getActiveColumnSetColumns(columnSets, schema.columns) ?? [],
      ),
    [],
  );
  const columnSetModel = useColumnSetModel({
    columnModel,
    defaultColumnSets: columnSets,
  });
  const [quickFilterColumns, setQuickFilterColumns] = useState(
    DEFAULT_QUICK_FILTER_COLUMNS,
  );

  return (
    <TabbedConfigPanel
      style={{ height: 600, position: "relative", width: 320 }}
      tabListLabel="Columns and quick filters"
    >
      <ConfigPanelTab label="Columns" value="columns">
        <ColumnPicker columnModel={columnModel} columnSetModel={columnSetModel} />
      </ConfigPanelTab>
      <ConfigPanelTab label="Quick filters" value="quick-filters">
        <QuickFilterColumnsPicker
          allItems={quickFilterItems}
          itemTypeName="field"
          onChangeColumns={setQuickFilterColumns}
          onResetColumns={() =>
            setQuickFilterColumns(DEFAULT_QUICK_FILTER_COLUMNS)
          }
          selectedItems={toItems(quickFilterColumns)}
        />
      </ConfigPanelTab>
    </TabbedConfigPanel>
  );
};

/**
 * Tabs can be included conditionally, and disabled. The second tab is
 * selected initially.
 */
export const ConditionalAndDisabledTabs = () => {
  const [showExtra, setShowExtra] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label>
        <input
          checked={showExtra}
          onChange={(e) => setShowExtra(e.target.checked)}
          type="checkbox"
        />{" "}
        Include the Extra tab
      </label>
      <TabbedConfigPanel
        defaultValue="general"
        style={{ height: 300, position: "relative", width: 320 }}
      >
        <ConfigPanelTab label="Display" value="display">
          <Text>Display settings</Text>
        </ConfigPanelTab>
        <ConfigPanelTab label="General" value="general">
          <Text>General settings</Text>
        </ConfigPanelTab>
        {showExtra ? (
          <ConfigPanelTab label="Extra" value="extra">
            <Text>Extra settings</Text>
          </ConfigPanelTab>
        ) : null}
        <ConfigPanelTab disabled label="Advanced" value="advanced">
          <Text>Advanced settings</Text>
        </ConfigPanelTab>
      </TabbedConfigPanel>
    </div>
  );
};

/**
 * A table whose footer action opens a TabbedConfigPanel in the context
 * panel, with Columns and Quick filters tabs. The quick filters are those
 * of the FilterBar.
 */
const TableWithColumnsAndQuickFiltersPanel = () => {
  const { VuuDataSource } = useData();

  const initialConfig = useMemo<TableConfig>(
    () => ({
      columns: getActiveColumnSetColumns(columnSets, schema.columns) ?? [],
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: initialConfig.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, initialConfig],
  );

  const { columnModel, onTableConfigChange, tableConfig } = useTableConfig({
    availableColumns: schema.columns,
    config: initialConfig,
    dataSource,
  });

  const columnSetModel = useColumnSetModel({
    columnModel,
    defaultColumnSets: columnSets,
  });

  const [quickFilterColumns, setQuickFilterColumns] = useState(
    DEFAULT_QUICK_FILTER_COLUMNS,
  );
  // context panel content is not re-rendered, read the latest when opened
  const quickFilterColumnsRef = useRef(quickFilterColumns);
  quickFilterColumnsRef.current = quickFilterColumns;

  const showContextPanel = useContextPanel();
  const showConfigPanel = useCallback(() => {
    showContextPanel(
      <TabbedConfigPanel tabListLabel="Columns and quick filters">
        <ConfigPanelTab label="Columns" value="columns">
          <ColumnPicker
            columnModel={columnModel}
            columnSetModel={columnSetModel}
          />
        </ConfigPanelTab>
        <ConfigPanelTab label="Quick filters" value="quick-filters">
          <ContextPanelColumnsPicker
            allItems={quickFilterItems}
            defaultSelectedItems={toItems(quickFilterColumnsRef.current)}
            itemTypeName="field"
            onChangeColumns={setQuickFilterColumns}
            resetColumns={DEFAULT_QUICK_FILTER_COLUMNS}
          />
        </ConfigPanelTab>
      </TabbedConfigPanel>,
      "Columns",
    );
  }, [columnModel, columnSetModel, showContextPanel]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", height: 40, padding: "0 8px" }}>
        <ColumnSetSwitcher columnSetModel={columnSetModel} />
      </div>
      <FilterBar
        QuickFilterProps={{
          onChangeQuickFilterColumns: setQuickFilterColumns,
          quickFilterColumns,
        }}
        columnDescriptors={schema.columns}
        onApplyFilter={(filter) => dataSource.setFilter?.(filter)}
        onClearFilter={() => dataSource.clearFilter?.()}
        variant="quick-filters-only"
        vuuTable={schema.table}
      />
      <div style={{ flex: "1 1 auto" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          onConfigChange={onTableConfigChange}
        />
      </div>
      <TableFooter>
        <DataSourceStats dataSource={dataSource} />
        <TableFooterTray>
          <IconButton
            appearance="transparent"
            aria-label="Columns and quick filters"
            data-action="table-settings"
            icon="settings"
            onClick={showConfigPanel}
            sentiment="neutral"
            size={20}
          />
        </TableFooterTray>
      </TableFooter>
    </div>
  );
};

export const TableWithColumnsAndQuickFilters = () => (
  <DemoTableContainer>
    <TableWithColumnsAndQuickFiltersPanel />
  </DemoTableContainer>
);
