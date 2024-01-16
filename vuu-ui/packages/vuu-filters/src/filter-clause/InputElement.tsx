import { TableSchema } from "@finos/vuu-data-types";
import cx from "clsx";
import { NumericInput } from "./NumericInput";
import { TextInput } from "./TextInput";
import { useFilterClauseEditor } from "./useFilterClauseEditor";

import { DateInput } from "./DateInput";
import { isDateTimeColumn } from "@finos/vuu-utils";
import { FilterClauseEditorProps } from "./FilterClauseEditor";
import { NumericFilterClauseOp } from "@finos/vuu-filter-types";

const classBase = "vuuFilterClause";

type InputElementProps = Pick<
  ReturnType<typeof useFilterClauseEditor>,
  | "selectedColumn"
  | "operator"
  | "InputProps"
  | "onChangeValue"
  | "onDeselectValue"
  | "value"
> &
  Pick<FilterClauseEditorProps, "suggestionProvider"> & {
    table: TableSchema["table"];
  };

export const InputElement: React.FC<InputElementProps> = ({
  selectedColumn,
  operator,
  InputProps,
  onChangeValue,
  onDeselectValue,
  suggestionProvider,
  table,
  value,
}) => {
  if (selectedColumn === undefined || operator === undefined) {
    return null;
  }

  if (isDateTimeColumn(selectedColumn)) {
    return (
      <DateInput
        value={value as number}
        operator={operator as NumericFilterClauseOp}
        onInputComplete={onChangeValue}
      />
    );
  }

  switch (selectedColumn.serverDataType) {
    case "string":
    case "char":
      return (
        <TextInput
          InputProps={InputProps}
          className={cx(`${classBase}Field`, `${classBase}Value`)}
          column={selectedColumn}
          data-field="value"
          onDeselect={onDeselectValue}
          onInputComplete={onChangeValue}
          operator={operator}
          suggestionProvider={suggestionProvider}
          table={table}
          value={value as string | string[]}
        />
      );
    case "int":
    case "long":
    case "double":
      return (
        <NumericInput
          InputProps={InputProps}
          className={cx(`${classBase}Field`, `${classBase}Value`)}
          column={selectedColumn}
          onInputComplete={onChangeValue}
          operator={operator}
        />
      );
    default:
      console.log("returning null");
      return null;
  }
};
