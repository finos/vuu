import { TableSchemaTable } from "@finos/vuu-data-types";
import { VuuTable } from "@finos/vuu-protocol-types";

export const getVuuTable = (schemaTable: TableSchemaTable): VuuTable => {
  if (schemaTable.session) {
    const { module, session } = schemaTable;
    return { module, table: session };
  } else {
    return schemaTable;
  }
};
