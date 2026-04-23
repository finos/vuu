import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnModel, TabbedTableConfigPanel } from "@vuu-ui/vuu-table-extras";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
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
        allowCreateCalculatedColumn
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
