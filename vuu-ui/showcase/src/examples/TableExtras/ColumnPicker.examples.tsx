import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ColumnModel,
  ColumnPicker,
  type ColumnPickerProps,
} from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";

const ColumnPickerTemplate = ({
  columnModel,
}: Pick<ColumnPickerProps, "columnModel">) => {
  return (
    <ColumnPicker
      columnModel={columnModel}
      style={{ width: 300, height: 800 }}
    />
  );
};

export const EmptyColumnPicker = () => {
  const columnModel = useMemo(() => new ColumnModel([], []), []);
  return <ColumnPickerTemplate columnModel={columnModel} />;
};

export const DefaultColumnPicker = () => {
  const columns: ColumnDescriptor[] = useMemo(
    () => [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      {
        name: "averagePrice",
        serverDataType: "double",
        label: "Average price",
      },
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
    ],
    [],
  );

  const columnModel = useMemo(
    () => new ColumnModel(columns, columns.slice(0, 10)),
    [columns],
  );

  return <ColumnPickerTemplate columnModel={columnModel} />;
};

export const ManyColumnColumnPicker = () => {
  const columnModel = useMemo(() => {
    const schema = getSchema("TwoHundredColumns");
    return new ColumnModel(schema.columns, schema.columns.slice(0, 10));
  }, []);

  return <ColumnPickerTemplate columnModel={columnModel} />;
};
