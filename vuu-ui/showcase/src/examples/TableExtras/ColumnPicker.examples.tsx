import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ColumnModel,
  ColumnPicker,
  type ColumnPickerProps,
} from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { MouseEventHandler, useCallback, useMemo } from "react";

const ColumnPickerTemplate = ({
  columnModel,
  allowCreateCalculatedColumn,
  onClickCreateCalculatedColumn,
}: Pick<
  ColumnPickerProps,
  | "columnModel"
  | "allowCreateCalculatedColumn"
  | "onClickCreateCalculatedColumn"
>) => {
  return (
    <ColumnPicker
      columnModel={columnModel}
      allowCreateCalculatedColumn={allowCreateCalculatedColumn}
      onClickCreateCalculatedColumn={onClickCreateCalculatedColumn}
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

export const CalculatedColumnPicker = () => {
  const allColumns: ColumnDescriptor[] = useMemo(
    () => [
      {
        name: "regularcolumn1",
        serverDataType: "string",
        label: "Regular column 1",
      },
      {
        name: "regularcolumn2",
        serverDataType: "string",
        label: "Regular column 2",
      },
      {
        name: "regularcolumn3",
        serverDataType: "string",
        label: "Regular column 3",
      },
      {
        name: "regularcolumn4",
        serverDataType: "string",
        label: "Regular column 4",
      },
      {
        name: "calculated:col:1",
        serverDataType: "string",
        label: "Calculated column 1",
        icon: "check-check",
      },
      {
        name: "calculated:col:2",
        serverDataType: "string",
        label: "Calculated column 2",
        icon: "check-check",
      },
    ],
    [],
  );

  const selectedColumns = useMemo(() => allColumns.slice(0, 3), [allColumns]);

  const handleClickCreateCustomItem = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(() => {
    console.log("handleClickCreateCustomItem() called");
  }, []);

  const columnModel = useMemo(
    () => new ColumnModel(allColumns, selectedColumns),
    [allColumns, selectedColumns],
  );

  return (
    <ColumnPickerTemplate
      columnModel={columnModel}
      allowCreateCalculatedColumn={true}
      onClickCreateCalculatedColumn={handleClickCreateCustomItem}
    />
  );
};
