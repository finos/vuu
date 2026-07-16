import { SchemaColumn } from "@vuu-ui/vuu-data-types";

export const VUU_DEFAULT_COLUMNS: SchemaColumn[] = [
  { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
  { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
  { name: "vuuMsg", serverDataType: "string" },
];
