import { getSchema } from "@vuu-ui/vuu-data-test";
import { DataSourceConfig, SchemaColumn } from "@vuu-ui/vuu-data-types";
import {
  ColumnChangeHandler,
  ColumnItem,
  ColumnList,
  ColumnListProps,
  defaultTableSettingsPermissions,
  TableSettingsPanel,
} from "@vuu-ui/vuu-table-extras";
import {
  ColumnListPermissions,
  TableConfig,
  TableSettingsPermissions,
  TableSettingsProps,
} from "@vuu-ui/vuu-table-types";
import {
  ChangeEventHandler,
  CSSProperties,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Checkbox,
  CheckboxGroup,
  FormField,
  FormFieldLabel,
} from "@salt-ds/core";

export const DefaultColumnList = () => {
  const initialColumns = useMemo<ColumnItem[]>(
    () => [
      {
        subscribed: true,
        label: "bbg",
        name: "bbg",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "description",
        name: "description",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "currency",
        name: "currency",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "exchange",
        name: "exchange",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "price",
        name: "price",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "quantity",
        name: "quantity",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "filledQty",
        name: "filledQty",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "lotSize",
        name: "lotSize",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "exchangeRate",
        name: "exchangeRate",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "isin",
        name: "isin",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "ric",
        name: "ric",
        serverDataType: "string",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "ask",
        name: "ask",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "bid",
        name: "bid",
        serverDataType: "double",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "i1",
        name: "i1",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "i2",
        name: "i2",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "i3",
        name: "i3",
        serverDataType: "int",
        isCalculated: false,
      } as const,
      {
        subscribed: true,
        label: "orderId",
        name: "orderId",
        serverDataType: "string",
        isCalculated: false,
      } as const,
    ],
    [],
  );

  const [columns, setColumns] = useState(initialColumns);

  const handleChange = () => {
    console.log("handleChange");
  };
  const handleReorderColumnItems = useCallback((columnItems: ColumnItem[]) => {
    setColumns(columnItems);
  }, []);

  return (
    <ColumnList
      columnItems={columns}
      style={{ width: 300, height: 600 }}
      onChange={handleChange}
      onReorderColumnItems={handleReorderColumnItems}
    />
  );
};

const ColumnListTemplate = ({
  columnItems,
  permissions,
  style,
}: Pick<ColumnListProps, "columnItems" | "permissions" | "style">) => {
  const [columns, setColumns] = useState<ColumnItem[]>(columnItems);

  const handleReorderColumnItems = useCallback((columnItems: ColumnItem[]) => {
    setColumns(columnItems);
  }, []);

  const handleChange = useCallback<ColumnChangeHandler>(
    (columnName, propertyName, value) => {
      console.log(`handleChange ${columnName} ${propertyName} = ${value}`);
      setColumns((columns) =>
        columns.map((col) => {
          if (col.name === columnName) {
            return {
              ...col,
              [propertyName]: value,
            };
          } else {
            return col;
          }
        }),
      );
    },
    [],
  );

  return (
    <ColumnList
      columnItems={columns}
      style={{ ...style, width: 300, height: 600 }}
      onChange={handleChange}
      onReorderColumnItems={handleReorderColumnItems}
      permissions={permissions}
    />
  );
};

export const ManyColumnList = () => {
  const initialColumns = useMemo<ColumnItem[]>(() => {
    const schema = getSchema("TwoHundredColumns");
    return schema.columns.map((col) => ({
      ...col,
      subscribed: true,
      isCalculated: false,
    }));
  }, []);

  return <ColumnListTemplate columnItems={initialColumns} />;
};
export const ManyColumnListRemoveOnly = () => {
  const initialColumns = useMemo<ColumnItem[]>(() => {
    const schema = getSchema("TwoHundredColumns");
    return schema.columns.map((col) => ({
      ...col,
      subscribed: true,
      isCalculated: false,
    }));
  }, []);
  const permissions = useMemo<ColumnListPermissions>(
    () => ({
      allowHideColumns: false,
    }),
    [],
  );

  return (
    <ColumnListTemplate
      columnItems={initialColumns}
      permissions={permissions}
    />
  );
};

export const ManyColumnListWithSearch = ({
  style,
}: {
  style?: CSSProperties;
}) => {
  const initialColumns = useMemo<ColumnItem[]>(() => {
    const schema = getSchema("TwoHundredColumns");
    return schema.columns.map((col) => ({
      ...col,
      subscribed: true,
      isCalculated: false,
    }));
  }, []);
  const permissions = useMemo<ColumnListPermissions>(
    () => ({
      allowColumnSearch: true,
      allowHideColumns: false,
    }),
    [],
  );

  return (
    <ColumnListTemplate
      columnItems={initialColumns}
      permissions={permissions}
      style={style}
    />
  );
};

export const ManyColumnListWithSearchStyled = () => (
  <ManyColumnListWithSearch style={{ background: "lightgray" }} />
);

const ConfigurableTableSettingsTemplate = ({
  availableColumns,
  tableConfig,
  permissions: permissionsProp = defaultTableSettingsPermissions,
}: Pick<
  TableSettingsProps,
  "availableColumns" | "tableConfig" | "permissions"
>) => {
  const [permissions, setPermissions] =
    useState<TableSettingsPermissions>(permissionsProp);
  const handleConfigChange = (config: TableConfig) => {
    console.log("handleConfigChange", {
      config,
    });
  };

  const handleDataSourceConfigChange = (config: DataSourceConfig) => {
    console.log("handleDataSourceConfigChange", {
      config,
    });
  };

  const handlePermissionChanged = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >((evt) => {
    console.log(
      `handlePermissionChanged ${evt.target.value} ${evt.target.checked}`,
    );
    setPermissions((existingPermissions) => ({
      ...existingPermissions,
      [evt.target.value]: evt.target.checked,
    }));
  }, []);

  return (
    <div style={{ display: "flex", gap: 100 }}>
      <div
        style={{
          margin: 30,
          width: 300,
          height: 700,
          border: "solid 1px lightgray",
        }}
      >
        <TableSettingsPanel
          availableColumns={availableColumns}
          onAddCalculatedColumn={() => console.log("add calculated column")}
          onConfigChange={handleConfigChange}
          onDataSourceConfigChange={handleDataSourceConfigChange}
          permissions={permissions}
          tableConfig={tableConfig}
        />
      </div>
      <div
        style={{
          width: 300,
          border: "solid 1px lightgray",
          padding: "var(--salt-spacing-100)",
        }}
      >
        <FormField>
          <FormFieldLabel>Table Permissions</FormFieldLabel>
          <CheckboxGroup
            direction="vertical"
            name="permissions"
            onChange={handlePermissionChanged}
          >
            <Checkbox
              checked={permissions.allowColumnLabelCase}
              label="Column labels"
              value="allowColumnLabelCase"
            />
            <Checkbox
              checked={permissions.allowColumnDefaultWidth}
              label="Column width"
              value="allowColumnDefaultWidth"
            />
            <Checkbox
              checked={permissions.allowGridSeparators}
              label="Grid separators"
              value="allowGridSeparators"
            />
            <Checkbox
              checked={permissions.allowReorderColumns}
              label="Reorder columns"
              value="allowReorderColumns"
            />
            <Checkbox
              checked={permissions.allowColumnSearch}
              label="Column Search"
              value="allowColumnSearch"
            />
            <Checkbox
              checked={permissions.allowRemoveColumns}
              label="Remove columns"
              value="allowRemoveColumns"
            />
            <Checkbox
              checked={permissions.allowHideColumns}
              label="Hide columns"
              value="allowHideColumns"
            />
            <Checkbox
              checked={permissions.allowCalculatedColumns}
              label="Calculated columns"
              value="allowCalculatedColumns"
            />
          </CheckboxGroup>
        </FormField>
      </div>
    </div>
  );
};

export const DefaultTableSettings = () => {
  const [availableColumns, tableConfig] = useMemo<
    [SchemaColumn[], TableConfig]
  >(
    () => [
      [
        { name: "ric", serverDataType: "string" },
        { name: "bbg", serverDataType: "string" },
        { name: "bid", serverDataType: "double" },
        { name: "ask", serverDataType: "double" },
        { name: "open", serverDataType: "double" },
        { name: "close", serverDataType: "double" },
        { name: "last", serverDataType: "double" },
      ],
      {
        columns: [],
      },
    ],
    [],
  );

  return (
    <ConfigurableTableSettingsTemplate
      availableColumns={availableColumns}
      permissions={defaultTableSettingsPermissions}
      tableConfig={tableConfig}
    />
  );
};
export const CustomisedTableSettings = () => {
  const [availableColumns, tableConfig] = useMemo<
    [SchemaColumn[], TableConfig]
  >(() => {
    const schema = getSchema("TwoHundredColumns");

    return [
      schema.columns.map((col) => ({
        ...col,
        subscribed: true,
        isCalculated: false,
      })),
      {
        columns: [],
      },
    ];
  }, []);

  const permissions = useMemo<ColumnListPermissions>(
    () => ({
      allowCalculatedColumns: false,
      allowColumnLabelCase: false,
      allowColumnSearch: true,
      allowColumnDefaultWidth: false,
      allowGridSeparators: false,
      allowHideColumns: false,
      allowRemoveColumns: true,
      allowReorderColumns: true,
    }),
    [],
  );

  /*

*/
  return (
    <>
      <style>
        {`
        .vuuTableSettingsPanel {
          --vuu-svg-tick: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 11"><path d="M0.181775 6.07176C-0.0605917 5.81472 -0.0605917 5.39636 0.181775 5.13659L1.06051 4.20279C1.30288 3.94575 1.69688 3.94575 1.93925 4.20279L4.97194 7.47314L11.7321 0.192776C11.9745 -0.0642586 12.3685 -0.0642586 12.6109 0.192776L13.4896 1.12794C13.732 1.38498 13.732 1.80471 13.4896 2.06038L5.41069 10.7435C5.16832 11.0005 4.77432 11.0005 4.53195 10.7435L0.181775 6.07176Z"/></svg>');
          --salt-content-primary-foreground: rgb(179,184,188);
          --salt-separable-tertiary-borderColor: rgba(255,255,255,.1);
          background-color: rgb(21,39,59);
          color: rgb(179,184,188);
          .vuuColumnList {
            .vuuColumnList-search {
              --vuu-icon-color: rgb(179,184,188);
              --vuu-icon-size: 20px;
              --saltInput-fontSize: 14px;
              --saltInput-height: 40px;
              --salt-editable-borderColor: rgb(179,184,188);
              --salt-editable-primary-background: rgb(25,46,63);
              --salt-editable-primary-background-active: rgb(25,46,63);
              font-size: 14px;
              .saltInput-focused {
                border-color: white;
                outline-color: rgb(179,184,188);
              }
          }
          .vuuColumnList-header {
            border-bottom: solid 1px var(--salt-separable-tertiary-borderColor);
            border-top: none;
            color: rgb(248,248,248);
            font-size: 12px;
            height: 32px;
            margin: 0 16px;
            padding: 0 0 0 20px;
            text-transform: uppercase;
          }
          .saltListBox {
            gap:0;
            padding: 0 var(--salt-spacing-400);
            text-transform: uppercase;
            .saltOption {
            --salt-selectable-background-hover: rgba(255,255,255,0.05);
              font-size: 13px;
              gap: 0;
              padding-left:0;
              .saltCheckbox {
                height: 18px;
                margin: 0 var(--salt-spacing-400) 0 var(--salt-spacing-100);
                .saltCheckbox-input {
                  height: 18px;
                  margin:0;
                  width: 18px;
                }
                .saltCheckboxIcon {
                  --salt-size-selectable: 18px;
                  background: rgba(255,255,255,.05);
                  border: solid 1px rgb(179,184,188);
                  border-radius: 6px;
                  margin:0;
                }
                .saltCheckboxIcon-checked {
                  background: rgb(217,217,217);
                  border: none;
                } 
                .saltCheckboxIcon-checked:after {
                  --vuu-icon-color: #111F2B;;
                  --vuu-icon-left: 2px;
                  --vuu-icon-size: 14px;
                  --vuu-icon-top: 2px;
                }
              }
              .vuuIconButton {
                --saltButton-minWidth: 16px;  
              }
                .vuuColumnList-text {
                  position: relative;
                  top: 1px;
                }
            }
          }
          }
          .saltButton {
            .vuuIcon {
              --vuu-icon-color: rgb(179,184,188) !important;
            }
          }
        }
      `}
      </style>
      <ConfigurableTableSettingsTemplate
        availableColumns={availableColumns}
        permissions={permissions}
        tableConfig={tableConfig}
      />
    </>
  );
};
