import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";

export type InlineAddRowValues = Record<string, VuuRowDataItemType>;
export type InlineAddRowErrors = Record<string, string>;

const requiredMessage = "Value required";

const isMissing = (value: VuuRowDataItemType | undefined) =>
  value === undefined || (typeof value === "string" && value.trim() === "");

export const getMissingValueErrors = (
  columnNames: string[],
  values: InlineAddRowValues,
): InlineAddRowErrors =>
  Object.fromEntries(
    columnNames
      .filter((name) => isMissing(values[name]))
      .map((name) => [name, requiredMessage]),
  );
