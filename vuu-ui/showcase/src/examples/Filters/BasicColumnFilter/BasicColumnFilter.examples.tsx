import {
  getSchema,
  LocalDataSourceProvider,
  VuuTableName,
} from "@vuu-ui/vuu-data-test";
import { BasicColumnFilter, BasicColumnFilterProps } from "@vuu-ui/vuu-filters";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useRef } from "react";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

const tableName: VuuTableName = "instruments";

type BasicColumnFilterTemplateProps = Pick<
  BasicColumnFilterProps,
  "initialValue" | "withStartAdornment"
>;

const BasicColumnFilterTemplate = ({
  initialValue,
  withStartAdornment,
}: BasicColumnFilterTemplateProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ricColumn, ricTable] = useMemo<[ColumnDescriptor, VuuTable]>(
    () => [
      {
        name: "ric",
        label: "RIC",
        serverDataType: "string",
      },
      { module: "SIMUL", table: tableName },
    ],
    [],
  );

  useEffect(() => {
    inputRef.current?.querySelector("input")?.focus();
  }, []);

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
      <input defaultValue="Start here" />
      <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
        <BasicColumnFilter
          data-testid="basiccolumnfilter"
          column={ricColumn}
          table={ricTable}
          onApplyFilter={(filter) => console.info(filter)}
          initialValue={initialValue}
          ref={inputRef}
          withStartAdornment={withStartAdornment}
        />
      </div>
      <input defaultValue="Exit here" />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const DefaultBasicColumnPicker = () => {
  return (
    <LocalDataSourceProvider>
      <BasicColumnFilterTemplate />
    </LocalDataSourceProvider>
  );
};

/** tags=data-consumer */
export const BasicColumnPickerWithInitialValue = () => {
  return (
    <LocalDataSourceProvider>
      <BasicColumnFilterTemplate initialValue="AAOO.L" />
    </LocalDataSourceProvider>
  );
};

/** tags=data-consumer */
export const BasicColumnPickerWithoutStartAdornment = () => {
  return (
    <LocalDataSourceProvider>
      <BasicColumnFilterTemplate withStartAdornment={false} />
    </LocalDataSourceProvider>
  );
};
