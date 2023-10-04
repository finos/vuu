import { TableProps } from "@finos/vuu-table";
import { TableSchema } from "@finos/vuu-data";

import "./BasketTableLive.css";

const classBase = "vuuBasketTableLive";

export interface BasketTableLiveProps extends Omit<TableProps, "config"> {
  tableSchema: TableSchema;
}

export const BasketTableLive = (props: BasketTableLiveProps) => {
  console.log({ props });
  return <div className={classBase} />;
};
