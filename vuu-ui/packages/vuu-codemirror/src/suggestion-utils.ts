import { Completion } from "@codemirror/autocomplete";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { isNumericColumn } from "@finos/vuu-utils";

export interface VuuCompletion extends Completion {
  isIllustration?: boolean;
}

export type CompletionOptions = {
  prefix?: string;
  quoted?: boolean;
  suffix?: string;
  isIllustration?: boolean;
};

const NO_OPTIONS: CompletionOptions = {};
const NO_OPERATORS = [] as Completion[];

export const toSuggestions = (
  values: string[],
  options = NO_OPTIONS
): VuuCompletion[] => {
  const {
    prefix = "",
    quoted = false,
    suffix = " ",
    isIllustration = false,
  } = options;
  const quote = quoted ? '"' : "";
  return values.map((value) => ({
    isIllustration,
    label: value,
    apply: isIllustration
      ? `${quote}${prefix}${quote}`
      : `${prefix}${quote}${value}${quote}${suffix}`,
  }));
};

export const asNameSuggestion = { label: "as", apply: "as ", boost: 1 };

export const booleanJoinSuggestions: Completion[] = [
  { label: "and", apply: "and ", boost: 5 },
  { label: "or", apply: "or ", boost: 3 },
];

export const equalityOperators: Completion[] = [
  { label: "=", boost: 10, type: "operator" },
  { label: "!=", boost: 9, type: "operator" },
];

export const stringOperators: Completion[] = [
  ...equalityOperators,
  { label: "in", boost: 6, type: "operator" },
  { label: "starts", boost: 5, type: "operator" },
  { label: "ends", boost: 4, type: "operator" },
];

export const numericOperators: Completion[] = [
  ...equalityOperators,
  { label: ">", boost: 8, type: "operator" },
  { label: "<", boost: 7, type: "operator" },
];

export const getRelationalOperators = (column?: ColumnDescriptor) => {
  if (column === undefined || isNumericColumn(column)) {
    return numericOperators;
  } else {
    return equalityOperators;
  }
};
