import { DataSourceConfig } from "@finos/vuu-data";
import { SuggestionFetcher } from "@finos/vuu-data-react";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  TypeaheadParams,
  VuuRowDataItemType,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { useMemo } from "react";
import { ArrayProxy } from "./ArrayProxy";
import { makeSuggestions } from "./makeSuggestions";
import { TickingArrayDataSource } from "@finos/vuu-data-test";
import { getColumnAndRowGenerator, populateArray } from "@finos/vuu-data-test";

const NO_CONFIG = {} as const;
const NO_COLUMNS: number[] = [];

export type ExtendedColumnConfig = { [key: string]: Partial<ColumnDescriptor> };

export interface TableConfigHookProps {
  /**
   * Additional column configuration to be applied to the base SchemaColumn
   * SchemaColumn provides just name and serverDataType. ANy of the attributes
   * defined on ColumnDescriptor can be added here e.g width, label, type
   */
  columnConfig?: ExtendedColumnConfig;
  /**
   * When simple column generation is in effect - number of columns to generate
   */
  columnCount?: number;
  /**
   * number of rows to generate
   */
  count?: number;
  /**
   * Only intended to generate large datasets to test extreme scrolling (in the
   * millions of rows). Generates rows of data on demand, no internal state, so
   * cannot support sorting, grouping etc. Uses an ArrayProxy
   */
  dataSourceConfig?: DataSourceConfig;
  lazyData?: boolean;
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  /**
   * should a range request respond with the full set of rows for the viewport or
   * just those rows which have nor previously been returned, the delta, Delta is
   * the default.
   */
  rangeChangeRowset?: "delta" | "full";
  /**
   * How many rows to render offscreen for better scroll render performance, without
   * whiteout
   */
  renderBufferSize?: number;
  /**
   * An alternative to columnCount, must be a known table, for which a custom data-
   * generator is available.
   */
  table?: VuuTable;
}

export const useTableConfig = ({
  columnConfig = NO_CONFIG,
  columnCount,
  count = 1000,
  dataSourceConfig,
  lazyData = false,
  leftPinnedColumns = NO_COLUMNS,
  rangeChangeRowset = "delta",
  rightPinnedColumns = NO_COLUMNS,
  renderBufferSize = 0,
  table,
}: TableConfigHookProps = {}) => {
  return useMemo(() => {
    if (typeof columnCount === "number" && table) {
      throw Error(
        `If a VuuTable is passed, columnCount should not be provided. 
        Only pass a Vuu table if a custom data generator is available 
        for that table`
      );
    }
    // Get custom data and column generators (if a table is available) otw the default
    // data generators will be returned
    const [columnGenerator, rowGenerator, createUpdateGenerator] =
      getColumnAndRowGenerator(table);

    // colCount is only used by the default generators
    const colCount =
      typeof columnCount === "number"
        ? columnCount
        : typeof table === "undefined"
        ? 10
        : undefined;

    const columns = table
      ? columnGenerator(dataSourceConfig?.columns ?? [], columnConfig)
      : columnGenerator(colCount, columnConfig);

    // We use an ArrayProxy in the rare scenario that we want a large dataset with no
    // support for sorting etc. Normally, we want to use a data generator to produce
    // test data to populate an ArrayDataSource
    const dataArray = lazyData
      ? new ArrayProxy<VuuRowDataItemType[]>(
          count,
          rowGenerator(columns?.map((col) => col.name))
        )
      : populateArray(
          count,
          columnGenerator,
          rowGenerator,
          colCount ?? columns?.map((col) => col.name)
        );

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new TickingArrayDataSource({
      ...dataSourceConfig,
      columnDescriptors: columns,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore yes we know an ArrayProxy is not a real Array, but don't tell the DataSource that
      data: dataArray,
      rangeChangeRowset,
      updateGenerator: createUpdateGenerator?.(),
    });

    /* We omit the first array argument, table, not needed here but we must 
     preserve the function signature. This function will be passed to 
     another hook which will call it at the right time and will pass three
     arguments in the array 
     */
    const suggestionFetcher: SuggestionFetcher = async ([
      ,
      column,
      pattern,
    ]: TypeaheadParams) => {
      if (lazyData) {
        return [];
      } else {
        return makeSuggestions(dataSource, column, pattern);
      }
    };

    const typeaheadHook = () => suggestionFetcher;

    return { config: { columns }, dataSource, renderBufferSize, typeaheadHook };
  }, [
    columnConfig,
    columnCount,
    count,
    dataSourceConfig,
    lazyData,
    leftPinnedColumns,
    rangeChangeRowset,
    renderBufferSize,
    rightPinnedColumns,
    table,
  ]);
};
