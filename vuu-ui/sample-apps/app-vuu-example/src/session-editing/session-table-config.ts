import {
  MenuRpcResponse,
  OpenDialogAction,
  TableSchema,
} from "@finos/vuu-data";
import { FormConfig, FormFieldDescriptor } from "@finos/vuu-shell";

const static_config: { [key: string]: Partial<FormConfig> } = {
  OPEN_EDIT_RESET_FIX: {
    title: "Reset the Sequence Number",
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

const mergeFields = (
  fields: FormFieldDescriptor[],
  staticFields?: FormFieldDescriptor[]
) => {
  if (Array.isArray(staticFields)) {
    return fields.map((field) => {
      const { name } = field;
      const staticField = staticFields.find((f) => f.name === name);
      if (staticField) {
        return {
          ...field,
          ...staticField,
        };
      } else {
        return field;
      }
    });
  } else {
    return fields;
  }
};

const getStaticConfig = (rpcName: string, formConfig: FormConfig) => {
  const staticConfig = static_config[rpcName];
  if (staticConfig) {
    return {
      ...formConfig,
      ...staticConfig,
      fields: mergeFields(formConfig.fields, staticConfig.fields),
    };
  } else {
    return formConfig;
  }
};

const defaultFormConfig = {
  fields: [],
  key: "",
  title: "",
};

const keyFirst = (c1: FormFieldDescriptor, c2: FormFieldDescriptor) =>
  c1.isKeyField ? -1 : c2.isKeyField ? 1 : 0;

const configFromSchema = ({ columns, key }: TableSchema): FormConfig => ({
  key,
  title: `Parameters for command`,
  fields: columns
    .map((col) => ({
      description: col.name,
      label: col.name,
      name: col.name,
      type: col.serverDataType,
      isKeyField: col.name === key,
    }))
    .sort(keyFirst),
});

export const getFormConfig = ({ action, rpcName }: MenuRpcResponse) => {
  const { tableSchema: schema } = action as OpenDialogAction;
  const config = configFromSchema(schema) ?? defaultFormConfig;

  if (rpcName !== undefined && rpcName in static_config) {
    return {
      config: getStaticConfig(rpcName, config),
      schema,
    };
  }

  return {
    config,
    schema,
  };
};
