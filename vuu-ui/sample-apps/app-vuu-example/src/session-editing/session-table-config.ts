import { FormConfig } from "@finos/vuu-shell";

const config: { [key: string]: FormConfig } = {
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
  title: "",
  fields: [],
};

export const getStaticFormConfig = (key?: keyof typeof config) => {
  if (key !== undefined) {
    return config[key];
  }
  return defaultFormConfig;
};
