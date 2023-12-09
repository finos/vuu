import { AnnotationType, Completion, EditorView } from "@finos/vuu-codemirror";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { isNumericColumn } from "@finos/vuu-utils";

export interface VuuCompletion extends Completion {
  isIllustration?: boolean;
}

export type CompletionOptions = {
  moveCursorToEnd?: boolean;
  prefix?: string;
  quoted?: boolean;
  suffix?: string;
  isIllustration?: boolean;
};

const NO_OPTIONS: CompletionOptions = {};

const applyWithCursorMove =
  () => (view: EditorView, completion: Completion, from: number) => {
    const annotation = new AnnotationType<Completion>();
    view.dispatch(
      {
        changes: { from, insert: completion.label },
        annotations: annotation.of(completion),
      },
      {
        changes: { from: from + 1, insert: " " },
        selection: { anchor: from + 2, head: from + 2 },
        annotations: annotation.of(completion),
      }
    );
  };

export const toSuggestions = (
  values: string[],
  options = NO_OPTIONS
): VuuCompletion[] => {
  const {
    moveCursorToEnd = false,
    prefix = "",
    quoted = false,
    suffix = " ",
    isIllustration = false,
  } = options;
  const quote = quoted ? '"' : "";
  return values.map((value) => ({
    isIllustration,
    label: value,
    apply: moveCursorToEnd
      ? applyWithCursorMove()
      : isIllustration
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

export const getNamePrompt = (entity?: string) => {
  const label = entity ? `enter name for this ${entity}` : "enter name";
  return [{ label, boost: 5 }];
};
