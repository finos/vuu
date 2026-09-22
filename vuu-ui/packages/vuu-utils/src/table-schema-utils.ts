import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type { SchemaColumn, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";

export const toSchemaColumn = ({
  editable,
  name,
  required,
  serverDataType = "string",
}: ColumnDescriptor): SchemaColumn => ({
  editable,
  name,
  required,
  serverDataType,
});

export const getVuuTable = (schemaTable: TableSchemaTable): VuuTable => {
  if (schemaTable.session) {
    const { module, session } = schemaTable;
    return { module, table: session };
  } else {
    return schemaTable;
  }
};
