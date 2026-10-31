import { getSchema } from "@vuu-ui/vuu-data-test";
import { ModalProvider } from "@vuu-ui/core";
import { ColumnModel, TabbedTableConfigPanel } from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";

const tableSchema = getSchema("instruments");

export const DefaultConfigPanel = () => {
  const columnModel = useMemo(() => {
    const model = new ColumnModel(
      tableSchema.columns,
      tableSchema.columns.slice(0, 6),
    );
    model.on("change", (columns, changeSource, changeDescriptor) => {
      console.log({ columns, changeSource, changeDescriptor });
    });
    return model;
  }, []);

  const tableDisplayAttributes = useMemo<TableConfig>(
    () => ({
      columns: tableSchema.columns,
      columnDefaultWidth: 100,
      columnSeparators: false,
      rowSeparators: false,
      zebraStripes: false,
    }),
    [],
  );

  return (
    <ModalProvider>
      <TabbedTableConfigPanel
        allowCreateCalculatedColumn={false}
        columnModel={columnModel}
        config={tableDisplayAttributes}
        onDisplayAttributeChange={(displayAttributes) =>
          console.log(JSON.stringify(displayAttributes))
        }
        vuuTable={tableSchema.table}
      />
    </ModalProvider>
  );
};

export const ConfigPanelAllowingCreationOfCalculatedColumns = () => {
  const allColumns: ColumnDescriptor[] = useMemo(
    () => [
      {
        name: "regularcolumn1",
        serverDataType: "string",
        label: "Regular column 1",
      },
      {
        name: "regularcolumn2",
        serverDataType: "string",
        label: "Regular column 2",
      },
      {
        name: "calculated:col:1",
        serverDataType: "string",
        label: "Calculated column 1",
        icon: "check-check",
      },
      {
        name: "calculated:col:2",
        serverDataType: "string",
        label: "Calculated column 2",
        icon: "check-check",
      },
    ],
    [],
  );
  const columnModel = useMemo(() => {
    const model = new ColumnModel(allColumns, allColumns.slice(0, 2));
    model.on("change", (columns, changeSource, changeDescriptor) => {
      console.log({ columns, changeSource, changeDescriptor });
    });
    return model;
  }, []);

  const tableDisplayAttributes = useMemo<TableConfig>(
    () => ({
      columns: allColumns,
      columnDefaultWidth: 100,
      columnSeparators: false,
      rowSeparators: false,
      zebraStripes: false,
    }),
    [],
  );

  return (
    <ModalProvider>
      <TabbedTableConfigPanel
        allowCreateCalculatedColumn={true}
        columnModel={columnModel}
        config={tableDisplayAttributes}
        onDisplayAttributeChange={(displayAttributes) =>
          console.log(JSON.stringify(displayAttributes))
        }
        vuuTable={tableSchema.table}
        style={{ height: 800 }}
      />
    </ModalProvider>
  );
};
