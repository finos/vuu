import { SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { DataSource, SubscribeCallback } from "@finos/vuu-data-types";
import { VuuDataRow } from "@finos/vuu-protocol-types";
import {
  OnChangeFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useRef, useState } from "react";
import { getCoreRowModel } from "./getCoreRowModel";
import {
  tanstackSortToVuuSort,
  vuuColumnsToTanstackColumns,
} from "./vuu-tanstack-utils";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { buildReverseColumnMap, ReverseColumnMap } from "@finos/vuu-utils";

const NO_DATA: VuuDataRow[] = [] as const;
const NO_SORT: SortingState = [] as const;

export interface TanstackTableProps {
  debug?: string;
  columns: ColumnDescriptor[];
}

export const useTanstackTableWithVuuDatasource = ({
  columns,
}: TanstackTableProps) => {
  const [data, setData] = useState<VuuDataRow[]>(NO_DATA);
  const sortStateRef = useRef<SortingState>(NO_SORT);

  const tanstackColumns = vuuColumnsToTanstackColumns(columns);
  console.log({ sortState: sortStateRef.current, tanstackColumns });

  const [dataSource, reverseColumnMap] = useMemo<
    [DataSource, ReverseColumnMap]
  >(() => {
    const ds =
      vuuModule<SimulTableName>("SIMUL").createDataSource("instruments");

    const dataSourceMessageHandler: SubscribeCallback = (message) => {
      switch (message.type) {
        case "subscribed":
          console.log("[useVuuData] dataSourceMessageHandler subscribed");
          break;
        case "viewport-update":
          console.log({ message });
          if (message.rows) {
            setData(message.rows);
          }
          break;
        default:
          console.log(
            `[useVuuData] dataSourceMessageHandler message type ${message.type}`,
          );
      }
    };

    ds.subscribe(
      {
        range: { from: 0, to: 16 },
      },
      dataSourceMessageHandler,
    );

    const columnMap = buildReverseColumnMap(ds.columns);

    return [ds, columnMap];
  }, []);

  const handleSortRequest = useCallback<OnChangeFn<SortingState>>(
    (updaterOrValue) => {
      sortStateRef.current =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sortStateRef.current)
          : updaterOrValue;
      dataSource.sort = tanstackSortToVuuSort(
        sortStateRef.current,
        reverseColumnMap,
      );
    },
    [dataSource, reverseColumnMap],
  );

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    onSortingChange: handleSortRequest,
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    manualPagination: true,
    rowCount: dataSource.size,
    state: {
      sorting: sortStateRef.current,
    },
  });

  return {
    dataSource,
    table,
  };
};
