import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnPicker, type ColumnPickerProps } from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useState } from "react";

const ColumnPickerTemplate = ({
  availableColumns = [],
  selectedColumns: selectedColumnsProp = [],
}: Partial<ColumnPickerProps>) => {
  const [selectedColumns, setSelectedColumns] = useState(selectedColumnsProp);

  return (
    <ColumnPicker
      availableColumns={availableColumns}
      onChangeSelectedColumns={setSelectedColumns}
      selectedColumns={selectedColumns}
      style={{ width: 300, height: 800 }}
    />
  );
};

export const EmptyColumnPicker = () => {
  return <ColumnPickerTemplate />;
};

export const DefaultColumnPicker = () => {
  const columns: ColumnDescriptor[] = [
    { name: "account", serverDataType: "string" },
    { name: "algo", serverDataType: "string" },
    { name: "averagePrice", serverDataType: "double", label: "Average price" },
    { name: "ccy", serverDataType: "string" },
    { name: "childCount", serverDataType: "int", label: "Child count" },
    { name: "exchange", serverDataType: "string" },
    { name: "filledQty", serverDataType: "double" },
    { name: "id", serverDataType: "string" },
    { name: "idAsInt", serverDataType: "int" },
    { name: "openQty", serverDataType: "double" },
    { name: "price", serverDataType: "double" },
    { name: "quantity", serverDataType: "double" },
    { name: "ric", serverDataType: "string" },
    { name: "side", serverDataType: "string" },
    { name: "status", serverDataType: "string" },
    { name: "volLimit", serverDataType: "int" },
    { name: "vuuCreatedTimestamp", serverDataType: "long" },
    { name: "vuuUpdatedTimestamp", serverDataType: "long" },
  ];

  return (
    <ColumnPickerTemplate
      availableColumns={columns}
      selectedColumns={columns.slice(0, 10)}
    />
  );
};

export const ManyColumnColumnPicker = () => {
  const schema = getSchema("TwoHundredColumns");

  return (
    <ColumnPickerTemplate
      availableColumns={schema.columns}
      selectedColumns={schema.columns.slice(0, 20)}
    />
  );
};
