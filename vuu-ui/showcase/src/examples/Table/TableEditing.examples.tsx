import {
  LocalDataSourceProvider,
  VuuTableName,
  getSchema,
} from "@finos/vuu-data-test";
import { DataSource, DataValueType } from "@finos/vuu-data-types";
import { Table, TableProps } from "@finos/vuu-table";
import {
  DataCellEditNotification,
  DefaultColumnConfiguration,
  TableConfig,
} from "@finos/vuu-table-types";
import {
  applyDefaultColumnConfig,
  registerComponent,
  useDataSource,
} from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { DropdownCell } from "@finos/vuu-table-extras";

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {
  userCanAssign: false,
});

const TableTemplate = ({
  getDefaultColumnConfig,
  selectionModel = "checkbox",
  tableName = "instrumentsExtended",
}: Partial<Pick<TableProps, "selectionModel">> & {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  tableName?: VuuTableName;
}) => {
  const schema = getSchema(tableName);

  const { VuuDataSource } = useDataSource();
  const [dataSource, config] = useMemo<[DataSource, TableConfig]>(() => {
    const dataSource = new VuuDataSource({ table: schema.table });
    const config = {
      columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
      rowSeparators: true,
      zebraStripes: true,
    };

    return [dataSource, config];
  }, [VuuDataSource, getDefaultColumnConfig, schema]);

  const handleDataEdited = useCallback<DataCellEditNotification>(
    ({
      editType = "commit",
      isValid = true,
      row,
      columnName,
      value,
      previousValue = value,
    }) => {
      console.log(
        `data edited [${row[0]}], ${columnName} ${previousValue} => ${value} (${editType}) isValid ${isValid}`,
      );
    },
    [],
  );

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={645}
      onDataEdited={handleDataEdited}
      renderBufferSize={10}
      selectionModel={selectionModel}
      width={9200}
    />
  );
};

const defaultEditableString: DataValueType = {
  name: "string",
  renderer: {
    name: "input-cell",
  },
};

export const EditableTable = () => {
  const getDefaultColumnConfig = useMemo<DefaultColumnConfiguration>(
    () => (_, columnName) => {
      switch (columnName) {
        case "bbg":
          return {
            editable: true,
            type: {
              name: "string",
              rules: [
                { name: "vuu-case", value: "upper" },
                {
                  name: "vuu-pattern",
                  value: "^.{5,8}$",
                  message: "Value must contain between 5 and 8 characters",
                },
              ],
            },
          };
        case "currency":
          return {
            editable: true,
            type: {
              name: "string",
              renderer: {
                name: "dropdown-cell",
                values: ["CAD", "EUR", "GBP", "GBX", "USD"],
              },
            },
          };
        case "lotSize":
          return {
            editable: true,
            type: {
              name: "number",
              rules: [{ name: "char-numeric", phase: "change" }],
            },
          };
        case "exchange":
          return {
            editable: true,
            type: defaultEditableString,
          };
        case "ric":
          return {
            editable: true,
            type: defaultEditableString,
          };
        case "wishlist":
          return {
            editable: true,
          };
      }
    },
    [],
  );

  return (
    <LocalDataSourceProvider>
      <TableTemplate getDefaultColumnConfig={getDefaultColumnConfig} />
    </LocalDataSourceProvider>
  );
};
