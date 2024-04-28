import { TableSchema } from "@finos/vuu-data-types";
import cx from "clsx";
import { FilterClauseValueEditorNumber } from "./FilterClauseValueEditorNumber";
import { FilterClauseValueEditorText } from "./FilterClauseValueEditorText";
import { useFilterClause } from "../useFilterClause";

import {
  NumericFilterClauseOp,
  SingleValueFilterClauseOp,
} from "@finos/vuu-filter-types";
import { isDateTimeColumn } from "@finos/vuu-utils";
import { FilterClauseValueEditorDate } from "./FilterClauseValueEditorDate";
import { FilterClauseProps } from "../FilterClause";

const classBase = "vuuFilterClause";

type FilterClauseValueEditorProps = Pick<
  ReturnType<typeof useFilterClause>,
  "selectedColumn" | "InputProps" | "onChangeValue" | "onDeselectValue"
> &
  Pick<FilterClauseProps, "suggestionProvider"> & {
    table?: TableSchema["table"];
  } & {
    operator?: SingleValueFilterClauseOp | "in";
    value?: string | string[] | number | number[] | boolean | boolean[];
  };

export const FilterClauseValueEditor: React.FC<
  FilterClauseValueEditorProps
> = ({
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
    console.log(`return DateInput`);
    return (
      <FilterClauseValueEditorDate
        InputProps={InputProps}
        className={cx(`${classBase}Field`, `${classBase}Value`)}
        data-field="value"
        value={value as number}
        operator={operator as NumericFilterClauseOp}
        onChangeValue={onChangeValue}
      />
    );
  }

  switch (selectedColumn.serverDataType) {
    case "string":
    case "char":
      return (
        <FilterClauseValueEditorText
          InputProps={InputProps}
          className={cx(`${classBase}Field`, `${classBase}Value`)}
          column={selectedColumn}
          data-field="value"
          onDeselect={onDeselectValue}
          onChangeValue={onChangeValue}
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
        <FilterClauseValueEditorNumber
          InputProps={InputProps}
          className={cx(`${classBase}Field`, `${classBase}Value`)}
          column={selectedColumn}
          data-field="value"
          onChangeValue={onChangeValue}
          operator={operator}
        />
      );
    default:
      console.log("returning null");
      return null;
  }
};
