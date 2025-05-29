import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { Table, buildDataColumnMapFromSchema } from "./Table";
import { metadataKeys } from "@vuu-ui/vuu-utils";

const { KEY } = metadataKeys;

export const createSessionTableFromSelectedRows = (
  table: Table,
  selectedRowIds: string[],
) => {
  const sessionData: VuuRowDataItemType[][] = [];
  for (let i = 0; i < selectedRowIds.length; i++) {
    for (let j = 0; j < table.data.length; j++) {
      if (table.data[j][KEY] === selectedRowIds[i]) {
        sessionData.push(table.data[j]);
      }
    }
  }

  return new Table(
    table.schema,
    sessionData,
    buildDataColumnMapFromSchema(table.schema),
  );
};
