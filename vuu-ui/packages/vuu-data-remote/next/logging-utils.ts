import { DataSourceRow } from "@vuu-ui/vuu-data-types";

const TIMESTAMP = 8;
// const IS_NEW = 9;

// TODO calculate average over 1 second
export const logLatency = (row: DataSourceRow) => {
  const now = Date.now();
  const ts = row[TIMESTAMP];
  console.log(`logLatency row [${row[0]}] ${now - ts}ms`);
};

export const logUnhandledMessage = (
  message: never,
  context = "[logUnhandledStruct]",
) => {
  console.log(`${context}  ${JSON.stringify(message)}`);
};
