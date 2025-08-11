import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { ColumnFilter } from "@vuu-ui/vuu-filters";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { useMemo } from "react";

const tableName: VuuTableName = "instruments";

/** tags=data-consumer */
export const TextColumnFilter = () => {
  const [column, table] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "ric",
        serverDataType: "string",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema(tableName);
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ padding: 100 }}>
        <FormField>
          <FormFieldLabel>RIC</FormFieldLabel>
          <ColumnFilter column={column} table={table} />
        </FormField>
      </div>
    </DataSourceProvider>
  );
};

export const TimeColumnFilter = () => {
  const [column, table] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "lastUpdate",
        serverDataType: "long",
        type: "time",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  return (
    <div style={{ padding: 100 }}>
      <FormField>
        <FormFieldLabel>Last Update</FormFieldLabel>
        <ColumnFilter column={column} table={table} />
      </FormField>
    </div>
  );
};

export const MultipleFilters = () => {
  const columns = useMemo<Record<string, ColumnDescriptor>>(
    () => ({
      ric: {
        name: "ric",
        serverDataType: "string",
      },
      lastUpdate: {
        name: "lastUpdate",
        serverDataType: "long",
        type: "time",
      },
    }),
    [],
  );

  const { VuuDataSource } = useData();
  const schema = getSchema(tableName);
  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource, schema.columns, schema.table]);

  return (
    <DataSourceProvider dataSource={dataSource}>
      <div style={{ border: "solid 1px lightgray", height: 400, width: 600 }}>
        <Input placeholder="Start here" />
        <FormField>
          <FormFieldLabel>RIC</FormFieldLabel>
          <ColumnFilter column={columns.ric} table={schema.table} />
        </FormField>
        <FormField>
          <FormFieldLabel>RIC</FormFieldLabel>
          <ColumnFilter
            column={columns.ric}
            showOperatorPicker
            table={schema.table}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Last Updated</FormFieldLabel>
          <ColumnFilter column={columns.lastUpdate} />
        </FormField>
        <FormField>
          <FormFieldLabel>Last Updated</FormFieldLabel>
          <ColumnFilter column={columns.lastUpdate} operator="between" />
        </FormField>
        <Input placeholder="exit here" />
      </div>
    </DataSourceProvider>
  );
};
