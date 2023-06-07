import {
  createSchemaFromTableMetadata,
  MenuRpcResponse,
  OpenDialogAction,
  TableSchema,
} from "@finos/vuu-data";
import { FormConfig } from "@finos/vuu-shell";

const static_config: { [key: string]: FormConfig } = {
  OPEN_EDIT_RESET_FIX: {
    title: "Reset the Sequence Number",
    key: "process-id",
    fields: [
      {
        label: "Process Id",
        description: "Process Id",
        name: "process-id",
        type: "string",
      },
      {
        description: "Sequence Number",
        label: "Sequence Number",
        name: "sequenceNumber",
        type: "long",
      },
    ],
  },
};

const defaultFormConfig = {
  fields: [],
  key: "",
  title: "",
};

const configFromSchema = (schema: TableSchema): FormConfig => ({
  key: schema.columns[0]?.name ?? "",
  title: `Parameters for command`,
  fields: schema.columns.map((col) => ({
    description: col.name,
    label: col.name,
    name: col.name,
    type: col.serverDataType,
  })),
});

export const getFormConfig = ({ action, rpcName }: MenuRpcResponse) => {
  const { columns, dataTypes, key, table } = action as OpenDialogAction;
  const schema = createSchemaFromTableMetadata({
    columns,
    dataTypes,
    key,
    table,
  });

  if (rpcName !== undefined && rpcName in static_config) {
    const config = static_config[rpcName];
    return {
      config,
      schema,
    };
  }

  return {
    config: configFromSchema(schema) ?? defaultFormConfig,
    schema,
  };
};
