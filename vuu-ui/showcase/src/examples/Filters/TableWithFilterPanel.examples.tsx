import { getSchema } from "@vuu-ui/vuu-data-test";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import {
  FilterPanel,
  FilterProvider,
  useFilterContextMenu,
  useSavedFilters,
} from "@vuu-ui/vuu-filters";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import type { ColumnDescriptor, RoundingRule } from "@vuu-ui/vuu-table-types";
import {
  filterAsQuery,
  getColumnsByName,
  getColumnsByNameForFilter,
  isTypeDescriptor,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import {
  filterColumns,
  InstrumentsExtendedColumnFilters,
  instrumentsExtendedColumns,
} from "./instruments-extended-columns";

const schema = getSchema("instrumentsExtended");

const TableWithFilterPanelTemplate = ({
  columns,
  filterColumns,
}: {
  columns: ColumnDescriptor[];
  filterColumns: ColumnDescriptor[];
}) => {
  const { VuuDataSource } = useData();
  const { currentFilter } = useSavedFilters();

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, columns],
  );

  // The filter is set by the FilterPanel or from the Table context menu
  useMemo(() => {
    if (currentFilter.filter) {
      dataSource.setFilter?.(currentFilter.filter);
    } else {
      dataSource.clearFilter?.();
    }
  }, [currentFilter, dataSource]);

  const columnsByName = useMemo(
    () => getColumnsByNameForFilter(schema, getColumnsByName(columns)),
    [columns],
  );

  const config = useMemo(() => ({ columns, rowSeparators: true }), [columns]);

  const filterContextMenuProps = useFilterContextMenu({
    filterColumns: filterColumns.map(toColumnName),
  });

  return (
    <div style={{ display: "flex", gap: 12, height: 700, padding: 12 }}>
      <FilterPanel style={{ flexShrink: 0, height: "100%", width: 300 }}>
        <InstrumentsExtendedColumnFilters
          columns={filterColumns}
          showOperatorPicker
        />
      </FilterPanel>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: 8,
          minWidth: 0,
        }}
      >
        <pre data-testid="vuu-filter-query" style={{ margin: 0 }}>
          {currentFilter.filter
            ? filterAsQuery(currentFilter.filter, { columnsByName })
            : ""}
        </pre>
        <DataSourceStats dataSource={dataSource} style={{ flex: "0 0 32px" }} />
        <ContextMenuProvider {...filterContextMenuProps}>
          <Table
            config={config}
            dataSource={dataSource}
            height={600}
            renderBufferSize={20}
            width={1100}
          />
        </ContextMenuProvider>
      </div>
    </div>
  );
};

const withRoundingRule = (
  columns: ColumnDescriptor[],
  roundingRule: RoundingRule,
) =>
  columns.map((column) =>
    column.serverDataType?.startsWith("scaleddecimal") &&
    isTypeDescriptor(column.type)
      ? {
          ...column,
          type: {
            ...column.type,
            formatting: { ...column.type.formatting, roundingRule },
          },
        }
      : column,
  );

/**
 * A Table with a FilterPanel, plus 'Set filter' / 'Add to filter' options in
 * the Table context menu. Scaled decimal columns display fewer decimal places
 * than they hold. A filter entered in the FilterPanel, or created from a cell
 * via the context menu, matches every row that displays the filter value.
 */
export const InstrumentsExtendedWithFilterPanel = () => (
  <FilterProvider>
    <TableWithFilterPanelTemplate
      columns={instrumentsExtendedColumns}
      filterColumns={filterColumns}
    />
  </FilterProvider>
);

/**
 * As InstrumentsExtendedWithFilterPanel, but scaled decimal values are
 * truncated, rather than rounded, for display. Filters match accordingly.
 */
export const InstrumentsExtendedWithFilterPanelTruncated = () => {
  const [columns, truncatedFilterColumns] = useMemo(
    () => [
      withRoundingRule(instrumentsExtendedColumns, "truncate"),
      withRoundingRule(filterColumns, "truncate"),
    ],
    [],
  );
  return (
    <FilterProvider>
      <TableWithFilterPanelTemplate
        columns={columns}
        filterColumns={truncatedFilterColumns}
      />
    </FilterProvider>
  );
};
