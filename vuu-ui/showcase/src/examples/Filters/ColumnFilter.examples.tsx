import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { ColumnFilter, ColumnFilterProps } from "@vuu-ui/vuu-filters";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { ColumnFilterValue } from "@vuu-ui/vuu-filters/src/column-filter/ColumnFilter";
import { Operator } from "@vuu-ui/vuu-filters/src/column-filter/useColumnFilter";

const tableName: VuuTableName = "instruments";
type ColumnFilterValueType = ColumnFilterValue | undefined;

const FancyStyle = ({ children }: { children: ReactNode }) => (
  <>
    <style>
      {`
        .TestColumnFilter {
          background: #15273b; 
          height: 100%;
          padding: 20px;
          width: 360px;
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

                .vuuTimeInput {
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
              .vuuTimeInput {
                border: none;
                font-family: var(--salt-typography-fontFamily);
                font-size: 14px;
                outline: none;
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
  label?: string;
}) => {
  const onCommit = (
    val: ColumnFilterValue | undefined,
    columnName: string,
    op: Operator,
  ) => {
    const range = Array.isArray(val) ? `${val[0]} and ${val[1]}` : val;
    console.info(`${columnName} ${op} ${range}`);
    onFilterChange?.(val, columnName, op);
  };

  return (
    <FormField>
      <FormFieldLabel>{label}</FormFieldLabel>
      <ColumnFilter
        data-testid="columnfilter"
        column={column}
        table={table}
        showOperatorPicker={showOperatorPicker}
        value={value}
        operator={operator}
        onFilterChange={onCommit}
      />
    </FormField>
  );
};

/** tags=data-consumer */
export const TextColumnFilter = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValueType>("");
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
      <ColumnFilterTemplate
        column={column}
        label="RIC"
        table={table}
        value={filterValue}
        onFilterChange={(value) => setFilterValue(value || "")}
      />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const TextColumnFilterValueSetViaBtn = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValue | undefined>(
    "AAOP.N",
  );

  const handleFilterChange = useCallback(
    (value: ColumnFilterValue | undefined) => {
      setFilterValue(value);
    },
    [],
  );

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
        label={"RIC"}
        table={table}
        value={filterValue}
        onFilterChange={handleFilterChange}
      />
    </DataSourceProvider>
  );
};

export const TimeColumnFilter = () => {
  const [filterValue, setFilterValue] =
    useState<ColumnFilterValueType>("00:00:01");
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
    <ColumnFilterTemplate
      column={column}
      label="Last Update"
      table={table}
      value={filterValue}
      onFilterChange={(value) => setFilterValue(value)}
    />
  );
};

export const TimeColumnRangeFilter = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValueType>([
    "00:00:00",
    "00:01:02",
  ]);
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
        <ColumnFilterTemplate
          column={column}
          operator="between"
          value={filterValue}
          onFilterChange={(value) => setFilterValue(value)}
        />
      </FormField>
    </div>
  );
};

export const TimeColumnRangeFilterWithStyle = () => {
  const [filterValue, setFilterValue] = useState<ColumnFilterValueType>([
    "00:00:00",
    "00:01:02",
  ]);

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
          <ColumnFilterTemplate
            label={"Last Update"}
            column={column}
            value={filterValue}
            onFilterChange={(value) => setFilterValue(value)}
            operator="between"
          />
        </FormField>
      </div>
    </FancyStyle>
  );
};

export const TimeColumnRangeFilterValueSetViaBtn = () => {
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

  const handleFilterChange = useCallback(
    (value: ColumnFilterValue | undefined) => {
      setTimeValue(value);
    },
    [],
  );

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

/** tags=data-consumer */
export const MultipleFilters = () => {
  const [textValue, setTextValue] = useState<ColumnFilterValue | undefined>(
    "AAOP.N",
  );
  const [timeValue, setTimeValue] = useState<ColumnFilterValue | undefined>(
    "07:00:00",
  );
  const [rangeTimeValue, setRangeTimeValue] = useState<
    ColumnFilterValue | undefined
  >(["07:00:00", "08:00:00"]);
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
      <div
        style={{
          border: "solid 1px lightgray",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: 400,
          width: 600,
        }}
      >
        <Input placeholder="Start here" />
        <FormField>
          <FormFieldLabel>RIC</FormFieldLabel>
          <ColumnFilter
            column={columns.ric}
            table={schema.table}
            value={textValue}
            onFilterChange={(val) => setTextValue(val)}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>RIC</FormFieldLabel>
          <ColumnFilter
            column={columns.ric}
            showOperatorPicker
            table={schema.table}
            value={textValue}
            onFilterChange={(val) => setTextValue(val)}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Last Updated</FormFieldLabel>
          <ColumnFilter
            column={columns.lastUpdate}
            value={timeValue}
            onFilterChange={(val) => setTimeValue(val)}
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Last Updated</FormFieldLabel>
          <ColumnFilter
            column={columns.lastUpdate}
            value={rangeTimeValue}
            onFilterChange={(val) => setRangeTimeValue(val)}
            operator="between"
          />
        </FormField>
        <Input placeholder="exit here" />
      </div>
    </DataSourceProvider>
  );
};
