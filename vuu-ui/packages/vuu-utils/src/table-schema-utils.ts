import type { SchemaColumn, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export const getVuuTable = (schemaTable: TableSchemaTable): VuuTable => {
  if (schemaTable.session) {
    const { module, session } = schemaTable;
    return { module, table: session };
  } else {
    return schemaTable;
  }
};

export const toSchemaColumn = ({ editable, name, serverDataType = 'string' }: ColumnDescriptor): SchemaColumn => {
  return {
    editable: editable === true || typeof editable === 'object',
    name,
    serverDataType
  }
}
