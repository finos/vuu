import { getSchema } from "@vuu-ui/vuu-data-test";
import { DataSourceConfig, SchemaColumn } from "@vuu-ui/vuu-data-types";
import {
  ColumnChangeHandler,
  ColumnItem,
  ColumnList,
  defaultTableSettingsPermissions,
  TableSettingsPanel,
} from "@vuu-ui/vuu-table-extras";
import {
  ColumnListPermissions,
  TableConfig,
  TableSettingsPermissions,
} from "@vuu-ui/vuu-table-types";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
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

export const ManyColumnList = () => {
  const initialColumns = useMemo<ColumnItem[]>(() => {
    const schema = getSchema("TwoHundredColumns");
    return schema.columns.map((col) => ({
      ...col,
      subscribed: true,
      isCalculated: false,
    }));
  }, []);

  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);

  const handleReorderColumnItems = useCallback((columnItems: ColumnItem[]) => {
    setColumns(columnItems);
  }, []);

  const handleChange = () => {
    console.log("handleChange");
  };

  return (
    <ColumnList
      columnItems={columns}
      style={{ width: 300, height: 600 }}
      onChange={handleChange}
      onReorderColumnItems={handleReorderColumnItems}
    />
  );
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

  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);

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
      style={{ width: 300, height: 600 }}
      onChange={handleChange}
      onReorderColumnItems={handleReorderColumnItems}
      permissions={permissions}
    />
  );
};

export const ManyColumnListWithSearch = () => {
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

  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);

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
      style={{ width: 300, height: 600 }}
      onChange={handleChange}
      onReorderColumnItems={handleReorderColumnItems}
      permissions={permissions}
    />
  );
};

export const DefaultTableSettings = () => {
  const [permissions, setPermissions] = useState<TableSettingsPermissions>(
    defaultTableSettingsPermissions,
  );
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
