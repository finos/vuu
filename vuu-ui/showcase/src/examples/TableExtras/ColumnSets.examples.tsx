import { getSchema } from "@vuu-ui/vuu-data-test";
import type { FilterState } from "@vuu-ui/vuu-filter-types";
import { FilterBar } from "@vuu-ui/vuu-filters";
import { Table, useTableConfig } from "@vuu-ui/vuu-table";
import {
  ColumnModel,
  ColumnPicker,
  ColumnPickerAction,
  ColumnSetSwitcher,
  type ColumnSetsChangeHandler,
  type ColumnSetsState,
  DataSourceStats,
  getActiveColumnSetColumns,
  TableFooter,
  TableFooterTray,
  useColumnSetModel,
} from "@vuu-ui/vuu-table-extras";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { DemoTableContainer } from "../Table/DemoTableContainer";

const schema = getSchema("instrumentsExtended");

const watchlistColumns = ["ric", "description", "currency", "exchange"];
const screeningColumns = ["ric", "description", "price", "lotSize", "notional"];

const twoColumnSets: ColumnSetsState = {
  activeColumnSet: "Watchlist",
  columnSets: [
    {
      name: "Watchlist",
      columns: watchlistColumns,
      savedColumns: watchlistColumns,
    },
    {
      name: "Screening",
      columns: screeningColumns,
      savedColumns: screeningColumns,
    },
  ],
};

const manyColumnSets: ColumnSetsState = {
  ...twoColumnSets,
  columnSets: twoColumnSets.columnSets.concat(
    ["Trading", "Reference", "Risk"].map((name, i) => {
      const columns = ["ric", schema.columns[i + 3].name, "price"];
      return { name, columns, savedColumns: columns };
    }),
  ),
};

/**
 * price is not a column of the Watchlist set. The filter still applies when
 * the Watchlist set is in view, VuuDataSource subscribes to it.
 */
const priceFilterState: FilterState = {
  activeIndices: [0],
  filters: [{ column: "price", op: ">", value: 500, name: "Price over 500" }],
};

const ColumnSetsTemplate = ({
  defaultColumnSets,
  filterState: defaultFilterState = priceFilterState,
}: {
  defaultColumnSets: ColumnSetsState;
  filterState?: FilterState;
}) => {
  const { VuuDataSource } = useData();

  const initialConfig = useMemo<TableConfig>(
    () => ({
      columns:
        getActiveColumnSetColumns(defaultColumnSets, schema.columns) ??
        schema.columns.filter(({ name }) => watchlistColumns.includes(name)),
      rowSeparators: true,
      zebraStripes: true,
    }),
    [defaultColumnSets],
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

  // The host persists column sets, e.g. in user settings
  const handleColumnSetsChange = useCallback<ColumnSetsChangeHandler>(
    (state, reason) => {
      console.log("[ColumnSets]", reason, state);
    },
    [],
  );

  const columnSetModel = useColumnSetModel({
    columnModel,
    defaultColumnSets,
    onChange: handleColumnSetsChange,
  });

  const [filterState, setFilterState] = useState(defaultFilterState);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        role="toolbar"
        aria-label="Instruments"
        style={{
          alignItems: "center",
          display: "flex",
          gap: 8,
          height: 40,
          padding: "0 8px",
        }}
      >
        <ColumnSetSwitcher columnSetModel={columnSetModel} />
      </div>
      <FilterBar
        columnDescriptors={schema.columns}
        filterState={filterState}
        onApplyFilter={(filter) => dataSource.setFilter?.(filter)}
        onClearFilter={() => dataSource.clearFilter?.()}
        onFilterStateChanged={setFilterState}
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
          <ColumnPickerAction
            columnModel={columnModel}
            columnSetModel={columnSetModel}
          />
        </TableFooterTray>
      </TableFooter>
    </div>
  );
};

/**
 * Two column sets, Watchlist and Screening, switched in the toolbar. The
 * filter, on price, stays applied whichever set is in view, though price is
 * not a column of the Watchlist set. The column picker, opened from the
 * footer, shows the active set and saves edits to it.
 */
export const TableWithColumnSets = () => (
  <DemoTableContainer>
    <ColumnSetsTemplate defaultColumnSets={twoColumnSets} />
  </DemoTableContainer>
);

/**
 * More column sets than fit as segments, the switcher is a dropdown.
 */
export const TableWithManyColumnSets = () => (
  <DemoTableContainer>
    <ColumnSetsTemplate defaultColumnSets={manyColumnSets} />
  </DemoTableContainer>
);

/**
 * No column sets saved yet, the picker shows 'Unnamed' and 'Save as…', the
 * switcher is hidden until there are two sets.
 */
export const TableWithNoColumnSets = () => (
  <DemoTableContainer>
    <ColumnSetsTemplate defaultColumnSets={{ columnSets: [] }} />
  </DemoTableContainer>
);

/**
 * A ColumnPicker with column sets, outside a context panel.
 */
export const ColumnPickerWithColumnSets = () => {
  const columnModel = useMemo(
    () =>
      new ColumnModel(
        schema.columns,
        getActiveColumnSetColumns(twoColumnSets, schema.columns) ?? [],
      ),
    [],
  );
  const columnSetModel = useColumnSetModel({
    columnModel,
    defaultColumnSets: twoColumnSets,
  });
  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <ColumnPicker
        columnModel={columnModel}
        columnSetModel={columnSetModel}
        style={{ height: 600, width: 300 }}
      />
      <div style={{ display: "flex", height: 40, width: 400 }}>
        <ColumnSetSwitcher columnSetModel={columnSetModel} />
      </div>
    </div>
  );
};
