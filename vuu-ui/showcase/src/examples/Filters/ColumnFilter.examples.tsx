import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { ColumnFilter, ColumnFilterProps } from "@vuu-ui/vuu-filters";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { ReactNode, useMemo, useState } from "react";
import { ColumnFilterValue } from "@vuu-ui/vuu-filters/src/column-filter/ColumnFilter";

const tableName: VuuTableName = "instruments";

const FancyStyle = ({ children }: { children: ReactNode }) => (
  <>
    <style>
      {`
        .TestColumnFilter {
          background: #15273b; 
          height: 100%;
          padding: 20px;
          width: 330px;
          .saltFormField {
            height: 40px;
            width: fit-content;
            .saltFormFieldLabel {
              align-self: center;
              color: white;
              font-size: 14px;
            }
            .vuuColumnFilter {
              background: #1d2e3e;
              padding: 4px;
              .vuuTimePicker {

                .TimeInput {
                  background: transparent;
                  border: none;
                  font-family: var(--salt-typography-fontFamily);
                  font-size: 14px;
                  text-align: center;
                  width: 70px;
                  &::selection {
                    background-color: #3a98f9;
                    color: white;
                  }

                }
              }
            }
            .vuuTimePicker {
            padding: 0 8px;
              .TimeInput {
                border: none;
                font-family: var(--salt-typography-fontFamily);
                font-size: 14px;
              }
            }
          }
        }
    `}
    </style>
    {children}
  </>
);

const ColumnFilterTemplate = ({
  column,
  label,
  table,
  value,
  operator,
  showOperatorPicker = false,
  onFilterChange,
}: Pick<
  ColumnFilterProps,
  | "column"
  | "table"
  | "value"
  | "operator"
  | "onFilterChange"
  | "showOperatorPicker"
> & {
  label: string;
}) => {
  return (
    <div style={{ padding: 100 }}>
      <FormField>
        <FormFieldLabel>{label}</FormFieldLabel>
        <ColumnFilter
          column={column}
          table={table}
          showOperatorPicker={showOperatorPicker}
          value={value}
          operator={operator}
          onFilterChange={onFilterChange}
        />
      </FormField>
    </div>
  );
};

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
      <ColumnFilterTemplate column={column} label="RIC" table={table} />
    </DataSourceProvider>
  );
};

export const TextColumnFilterControlled = () => {
  //TODO - need to update column filter examples to use state
  const [filterValue, setFilterValue] = useState<ColumnFilterValue | undefined>(
    "AAOP.N",
  );

  const handleFilterChange = (value: ColumnFilterValue | undefined) => {
    setFilterValue(value);
    console.log(value);
  };

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
      <div style={{ display: "flex", gap: 5 }}>
        <Button onClick={() => setFilterValue("AAOQ.OQ")}>AAOQ.OQ</Button>
        <Button onClick={() => setFilterValue("AAOU.MI")}>AAOU.MI</Button>
      </div>
      <ColumnFilterTemplate
        column={column}
        label="RIC"
        table={table}
        value={filterValue}
        onFilterChange={handleFilterChange}
      />
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
    <ColumnFilterTemplate column={column} label="Last Update" table={table} />
  );
};

export const TimeColumnRangeFilter = () => {
  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "lastUpdate",
      serverDataType: "long",
      type: "time",
    }),
    [],
  );

  return (
    <div style={{ padding: 100 }}>
      <FormField>
        <FormFieldLabel>Last Update</FormFieldLabel>
        <ColumnFilter
          column={column}
          value={["00:00:00", "23:59:59"]}
          operator="between"
        />
      </FormField>
    </div>
  );
};

export const TimeColumnRangeFilterWithStyle = () => {
  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "lastUpdate",
      serverDataType: "long",
      type: "time",
    }),
    [],
  );

  return (
    <FancyStyle>
      <div className="TestColumnFilter">
        <FormField labelPlacement="left">
          <FormFieldLabel>May 15,2025</FormFieldLabel>
          <ColumnFilter
            column={column}
            value={["00:00:00", "23:59:59"]}
            operator="between"
          />
        </FormField>
      </div>
    </FancyStyle>
  );
};

export const TimeColumnRangeFilterControlled = () => {
  const [timeValue, setTimeValue] = useState<ColumnFilterValue | undefined>([
    "07:00:00",
    "08:00:00",
  ]);

  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "orderCreationTime",
      serverDataType: "long",
      type: "time",
    }),
    [],
  );

  const handleFilterChange = (value: ColumnFilterValue | undefined) => {
    setTimeValue(value);
    console.log(value);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 5 }}>
        <Button onClick={() => setTimeValue(["02:00:00", "03:00:00"])}>
          02:00:00 - 03:00:00
        </Button>
        <Button onClick={() => setTimeValue(["04:00:00", "05:00:00"])}>
          04:00:00 - 05:00:00
        </Button>
      </div>

      <ColumnFilterTemplate
        column={column}
        label="Time"
        value={timeValue}
        operator="between"
        onFilterChange={handleFilterChange}
      />
    </>
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
