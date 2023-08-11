import { ColumnDescriptor } from "packages/vuu-datagrid-types";
import { useMemo } from "react";
import { ColumnList } from "../column-list";

import "./TableSettings.css";

const classBase = "vuuTableSettingsPanel";

export const TableSettingsPanel = () => {
  const columns = useMemo<ColumnDescriptor[]>(
    () => [
      { name: "bbg", serverDataType: "string" } as const,
      { name: "description", serverDataType: "string" } as const,
      { name: "currency", serverDataType: "string" } as const,
      { name: "exchange", serverDataType: "string" } as const,
      { name: "price", serverDataType: "double" } as const,
      { name: "quantity", serverDataType: "int" } as const,
      { name: "filledQty", serverDataType: "int" } as const,
      { name: "lotSize", serverDataType: "int" } as const,
      { name: "exchangeRate", serverDataType: "double" } as const,
      { name: "isin", serverDataType: "string" } as const,
      { name: "ric", serverDataType: "string" } as const,
      { name: "ask", serverDataType: "double" } as const,
      { name: "bid", serverDataType: "double" } as const,
      { name: "i1", serverDataType: "int" } as const,
      { name: "i2", serverDataType: "int" } as const,
      { name: "i3", serverDataType: "int" } as const,
      { name: "orderId", serverDataType: "string" } as const,
    ],
    []
  );

  return (
    <div className={classBase}>
      <ColumnList columns={columns} />
    </div>
  );
};
