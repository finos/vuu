import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { Table, buildDataColumnMapFromSchema } from "./Table";
import { metadataKeys } from "@vuu-ui/vuu-utils";
import type { TableSchema } from "@vuu-ui/vuu-data-types";

const { KEY } = metadataKeys;

export const sessionTableRow = (
  row: Array<bigint | VuuRowDataItemType>,
  schema: TableSchema,
) => {
  const sessionRow = row.slice();
  if (!schema.columns.some(({ name }) => name === "vuuMsg")) {
    sessionRow.push("");
  }
  if (!schema.columns.some(({ name }) => name === "vuu_action")) {
    sessionRow.push("");
  }
  return sessionRow;
};

export const createSessionTableFromSelectedRows = (
  table: Table,
  selectedRowIds: string[],
) => {
  const sessionData: Array<bigint | VuuRowDataItemType>[] = [];
  for (let i = 0; i < selectedRowIds.length; i++) {
    for (let j = 0; j < table.data.length; j++) {
      if (table.data[j][KEY] === selectedRowIds[i]) {
        sessionData.push(sessionTableRow(table.data[j], table.schema));
      }
    }
  }

  const schema = sessionTableSchema(table.schema);
  return new Table(schema, sessionData, buildDataColumnMapFromSchema(schema));
};

export const sessionTableSchema = (schema: TableSchema): TableSchema => {
  const columns = schema.columns.slice();
  if (!columns.some(({ name }) => name === "vuuMsg")) {
    columns.push({ name: "vuuMsg", serverDataType: "string" });
  }
  if (!columns.some(({ name }) => name === "vuu_action")) {
    columns.push({ name: "vuu_action", serverDataType: "string" });
  }
  return { ...schema, columns };
};
