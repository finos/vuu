import { ArrayDataSource, SuggestionFetcher } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  TypeaheadParams,
  VuuRowDataItemType,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { useMemo } from "react";
import { ArrayProxy } from "./ArrayProxy";
import { makeSuggestions } from "./makeSuggestions";
import { getColumnAndRowGenerator, populateArray } from "./vuu-row-generator";

const NO_CONFIG = {} as const;
const NO_COLUMNS: number[] = [];

export const useTableConfig = ({
  columnConfig = NO_CONFIG,
  columnCount,
  count = 1000,
  lazyData = false,
  leftPinnedColumns = NO_COLUMNS,
  rangeChangeRowset = "delta",
  rightPinnedColumns = NO_COLUMNS,
  renderBufferSize = 0,
  table,
}: {
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> };
  columnCount?: number;
  count?: number;
  lazyData?: boolean;
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  rangeChangeRowset?: "delta" | "full";
  renderBufferSize?: number;
  table?: VuuTable;
} = {}) => {
  return useMemo(() => {
    console.log(
      "%cuseTableConfig Memo invoked",
      "color: red; font-weight: bold;"
    );

    if (typeof columnCount === "number" && table) {
      throw Error("if a VuuTable is passed, colunCount should not be provided");
    }

    const [columnGenerator, rowGenerator] = getColumnAndRowGenerator(table);
    const colCount =
      typeof columnCount === "number"
        ? columnCount
        : typeof table === "undefined"
        ? 10
        : undefined;

    const columns = table
      ? columnGenerator([], columnConfig)
      : columnGenerator(colCount, columnConfig);

    const dataArray = lazyData
      ? new ArrayProxy<VuuRowDataItemType[]>(count, rowGenerator(colCount))
      : populateArray(
          count,
          columnGenerator,
          rowGenerator,
          colCount ?? columns?.map((col) => col.name)
        );

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data: dataArray,
      rangeChangeRowset,
    });

    const suggestionFetcher: SuggestionFetcher = async ([
      table,
      column,
      pattern,
    ]: TypeaheadParams) => {
      console.log(`suggestionFetcher`, {
        table,
        column,
        pattern,
      });
      if (lazyData) {
        return [];
      } else {
        return makeSuggestions(dataSource, column, pattern);
      }
      // } else if (table.table === "instruments" && column === "currency") {
      //   return ["CAD", "EUR", "GBP", "GBX", "USD"];
      // } else {
      //   return [];
      // }
    };

    const typeaheadHook = () => suggestionFetcher;

    return { config: { columns }, dataSource, renderBufferSize, typeaheadHook };
  }, [
    columnConfig,
    columnCount,
    count,
    lazyData,
    leftPinnedColumns,
    rangeChangeRowset,
    renderBufferSize,
    rightPinnedColumns,
    table,
  ]);
};
