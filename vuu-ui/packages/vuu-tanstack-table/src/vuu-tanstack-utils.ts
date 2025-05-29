import { VuuSort, VuuSortCol } from "@vuu-ui/vuu-protocol-types";
import { buildColumnMap } from "@vuu-ui/vuu-utils";
import { type SortingState } from "@tanstack/react-table";
import { TableColumnDef } from "./tanstack-table-types";
import { DataSourceRow as VuuDataSourceRow } from "@vuu-ui/vuu-data-types";
import {
  AccessorKeyColumnDef,
  ColumnDef,
  RowData,
} from "@tanstack/react-table";

const ACCESSORKEY_ERROR =
  "[vuu-tanstack-utils] to map Vuu data to tanstack columns, string accessorKey must be used";

export const tanstackSortToVuuSort = (sortingState: SortingState): VuuSort => ({
  sortDefs: sortingState.map<VuuSortCol>((columnSort) => {
    return {
      column: columnSort.id,
      sortType: columnSort.desc ? "D" : "A",
    };
  }),
});

const isStringAccessorKey = (accessorKey: unknown): accessorKey is string =>
  typeof accessorKey === "string";

export const tanstackColumnAccessorsToVuuColumnAccessors = (
  columns: TableColumnDef<VuuDataSourceRow>[],
): TableColumnDef<VuuDataSourceRow>[] => {
  const columnsWithAccessorKeys = columns.map<
    AccessorKeyColumnDef<VuuDataSourceRow>
  >((columnDef) => {
    if (isAccessorKeyColumnDef(columnDef)) {
      return columnDef;
    } else {
      throw Error(ACCESSORKEY_ERROR);
    }
  });

  const columnNames = columnsWithAccessorKeys.map<string>((col) => {
    if (isStringAccessorKey(col.accessorKey)) {
      return col.accessorKey;
    } else {
      throw Error(ACCESSORKEY_ERROR);
    }
  });
  const columnMap = buildColumnMap(columnNames);

  return columnsWithAccessorKeys.map<TableColumnDef<VuuDataSourceRow>>(
    ({ accessorKey, ...rest }) => {
      if (isStringAccessorKey(accessorKey)) {
        return {
          accessorKey,
          accessorFn: (row) => row[columnMap[accessorKey]],
          ...rest,
        };
      } else {
        throw Error(ACCESSORKEY_ERROR);
      }
    },
  );
};

export const isAccessorKeyColumnDef = <T extends RowData = unknown>(
  columnDef: ColumnDef<T>,
): columnDef is AccessorKeyColumnDef<T> =>
  "accessorKey" in (columnDef as AccessorKeyColumnDef<T>);

/*
type VuuDataSourceMeta = [number, number, string, number];

type ValueArr<T, KeysTuple extends readonly (keyof T)[]> = {
  [Index in keyof KeysTuple]: T[KeysTuple[Index]];
};

interface Instrument {
    bbg: string;
    ric: string;
    lotsize: number;
}

const vod: Instrument = {
    bbg:'VOD',
    ric: 'VOD.L',
    lotsize: 100    
}

type IKeys = keyof Instrument

const InstrumentKeys = ['bbg','ric','lotsize'] as const

type VuuDataRow = Readonly<Array<number | string | boolean>>;

type InstrumentTuple = ValueArr<Instrument, typeof InstrumentKeys>;
type VuuDataSource<T extends VuuDataRow = VuuDataRow> = [...VuuDataSourceMeta, ...T];

const vodRow: VuuDataSource<InstrumentTuple> = [0, 0, 'VOD.L', 0,'VOD', 'VOD.L', 100]
*/
