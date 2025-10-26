import { SchemaColumn } from "@vuu-ui/vuu-data-types";
import { SimulTable } from "./SimulTableTemplate";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  ColumnDescriptor,
  ShowColumnHeaderMenus,
} from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";

export const AllColumnsSubscribed = () => {
  return <SimulTable />;
};

export const AllColumnsSubscribedNotAllRendered = () => {
  const availableColumns: SchemaColumn[] = [
    { name: "bbg", serverDataType: "string" },
    { name: "currency", serverDataType: "string" },
    { name: "description", serverDataType: "string" },
    { name: "exchange", serverDataType: "string" },
    { name: "lotSize", serverDataType: "int" },
    { name: "ric", serverDataType: "string" },
  ];
  const columns = [{ name: "bbg" }, { name: "lotSize" }, { name: "ric" }];

  return <SimulTable availableColumns={availableColumns} columns={columns} />;
};

export const SomeColumnsSubscribedWithAutoSubscribeColumns = () => {
  const tableName = "parentOrders";
  const schema = getSchema(tableName);
  const { VuuDataSource } = useData();

  const columns = useMemo<ColumnDescriptor[]>(
    () => [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "price", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "exchange", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "filledQty", serverDataType: "double" },
    ],
    [],
  );

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        autosubscribeColumns: ["vuuCreatedTimestamp", "vuuUpdatedTimestamp"],
        columns: columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, columns, schema.table],
  );

  return (
    <SimulTable
      availableColumns={schema.columns}
      columns={columns}
      dataSource={dataSource}
      tableName={tableName}
    />
  );
};

export const WithAllowRemoveColumnsOnly = () => {
  const tableName = "parentOrders";
  const schema = getSchema(tableName);
  const { VuuDataSource } = useData();

  const columns = useMemo<ColumnDescriptor[]>(
    () => [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "price", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "exchange", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "filledQty", serverDataType: "double" },
    ],
    [],
  );

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        autosubscribeColumns: ["vuuCreatedTimestamp", "vuuUpdatedTimestamp"],
        columns: columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, columns, schema.table],
  );

  const columnHeaderMenuPermissions = useMemo<ShowColumnHeaderMenus>(
    () => ({
      allowColumnSettings: false,
      allowPin: false,
      allowTableSettings: {
        allowCalculatedColumns: false,
        allowColumnLabelCase: false,
        allowColumnDefaultWidth: false,
        allowGridSeparators: false,
        allowHideColumns: false,
      },
    }),
    [],
  );

  return (
    <SimulTable
      availableColumns={schema.columns}
      columns={columns}
      dataSource={dataSource}
      showColumnHeaderMenus={columnHeaderMenuPermissions}
      tableName={tableName}
    />
  );
};
