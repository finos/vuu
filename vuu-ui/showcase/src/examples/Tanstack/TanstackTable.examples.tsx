import { useMemo } from "react";
import { TanstackTable } from "vuu-tanstack-table";

import "./index.css";
import { ColumnDescriptor } from "@finos/vuu-table-types";

export type DataRowAtIndexFunc<T = unknown> = (index: number) => T[];

export const TanstackTableDefault = () => {
  const columns = useMemo<Array<ColumnDescriptor>>(
    () => [
      {
        name: "bbg",
        label: "BBG",
      },
      {
        name: "currency",
        label: "Currency",
      },
      {
        name: "description",
        label: "Description",
      },
      {
        name: "exchange",
        label: "Exchange",
      },
      {
        name: "isin",
        label: "ISIN",
      },
      {
        name: "lotsize",
        label: "Lotsize",
      },
      {
        name: "ric",
        label: "RIC",
      },
    ],
    [],
  );

  return <TanstackTable columns={columns} />;
};
