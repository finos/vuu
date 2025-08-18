import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { BasicColumnFilter, BasicColumnFilterProps } from "@vuu-ui/vuu-filters";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

const tableName: VuuTableName = "instruments";

type BasicColumnFilterTemplateProps = Pick<
  BasicColumnFilterProps,
  "initialValue" | "active"
>;

const BasicColumnFilterTemplate = ({
  initialValue,
  active = true,
}: BasicColumnFilterTemplateProps) => {
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
          data-testid="riccolumnfilter"
          column={ricColumn}
          table={ricTable}
          onApplyFilter={(filter) => console.info(filter)}
          active={active}
          initialValue={initialValue}
        />
      </div>
      <input defaultValue="Exit here" />
    </DataSourceProvider>
  );
};

export const DefaultBasicColumnPicker = () => {
  return <BasicColumnFilterTemplate />;
};

export const BasicColumnPickerWithInitialValue = () => {
  return <BasicColumnFilterTemplate initialValue="AAOO.L" />;
};

export const BasicColumnPickerSetToInActive = () => {
  return <BasicColumnFilterTemplate active={false} />;
};
