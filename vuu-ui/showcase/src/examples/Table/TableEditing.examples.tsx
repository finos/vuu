import {
  LocalDataSourceProvider,
  VuuTableName,
  getSchema,
} from "@vuu-ui/vuu-data-test";
import { DataSource, DataValueType } from "@vuu-ui/vuu-data-types";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import {
  ColumnDescriptor,
  DataCellEditNotification,
  DefaultColumnConfiguration,
  RowActionHandler,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import {
  applyDefaultColumnConfig,
  registerComponent,
  useData,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { DropdownCell } from "@vuu-ui/vuu-table-extras";
import { IconButtonCell } from "@vuu-ui/vuu-table-extras";

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {
  userCanAssign: false,
});
registerComponent("icon-button-cell", IconButtonCell, "cell-renderer", {
  userCanAssign: false,
});

const TableTemplate = ({
  columns: columnProps,
  dataSource: dataSourceProp,
  getDefaultColumnConfig,
  rowActionHandlers,
  selectionModel = "checkbox",
  tableName = "instrumentsExtended",
}: Partial<
  Pick<TableProps, "dataSource" | "rowActionHandlers" | "selectionModel">
> & {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  columns?: ColumnDescriptor[];
  tableName?: VuuTableName;
}) => {
  const schema = getSchema(tableName);

  const { VuuDataSource } = useData();
  const [dataSource, config] = useMemo<[DataSource, TableConfig]>(() => {
    const dataSource =
      dataSourceProp ?? new VuuDataSource({ table: schema.table });
    const config = {
      columns:
        columnProps ?? applyDefaultColumnConfig(schema, getDefaultColumnConfig),
      rowSeparators: true,
      zebraStripes: true,
    };

    return [dataSource, config];
  }, [
    VuuDataSource,
    columnProps,
    dataSourceProp,
    getDefaultColumnConfig,
    schema,
  ]);

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
      rowActionHandlers={rowActionHandlers}
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

const DeleteColumn: ColumnDescriptor = {
  className: "vuuIconDeleteRow",
  label: "",
  maxWidth: 24,
  name: "delete-row",
  source: "client",
  type: {
    name: "boolean",
    renderer: {
      name: "icon-button-cell",
    },
  },
  width: 24,
};

export const DeleteRows = () => {
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");

  const columns = useMemo(() => {
    return (schema.columns as ColumnDescriptor[]).concat(DeleteColumn);
  }, [schema.columns]);

  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

  const rowActionHandlers = useMemo<Record<string, RowActionHandler>>(
    () => ({
      "delete-row": (_, row) => {
        dataSource.rpcRequest?.({
          params: {
            key: row[6],
          },
          type: "RPC_REQUEST",
          rpcName: "DELETE_ROW",
        });
      },
    }),
    [dataSource],
  );

  return (
    <>
      <style>{`
      .vuuIconDeleteRow {
        --vuu-icon-svg: var(--svg-close);
      }
    `}</style>
      <LocalDataSourceProvider>
        <TableTemplate
          columns={columns}
          dataSource={dataSource}
          rowActionHandlers={rowActionHandlers}
          tableName="instruments"
        />
      </LocalDataSourceProvider>
    </>
  );
};
