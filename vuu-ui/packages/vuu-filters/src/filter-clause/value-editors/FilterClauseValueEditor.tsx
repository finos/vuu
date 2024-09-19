import { TableSchemaTable } from "@finos/vuu-data-types";
import cx from "clsx";
import { useFilterClause } from "../useFilterClause";
import { FilterClauseValueEditorNumber } from "./FilterClauseValueEditorNumber";
import { FilterClauseValueEditorText } from "./FilterClauseValueEditorText";

import {
  NumericFilterClauseOp,
  SingleValueFilterClauseOp,
} from "@finos/vuu-filter-types";
import { isDateTimeDataValue } from "@finos/vuu-utils";
import { ForwardedRef, forwardRef } from "react";
import { FilterClauseProps } from "../FilterClause";
import { FilterClauseValueEditorDate } from "./FilterClauseValueEditorDate";

const classBase = "vuuFilterClause";

type FilterClauseValueEditorProps = Pick<
  ReturnType<typeof useFilterClause>,
  "selectedColumn" | "inputProps" | "onChangeValue" | "onDeselectValue"
> &
  Pick<FilterClauseProps, "suggestionProvider"> & {
    table?: TableSchemaTable;
  } & {
    operator?: SingleValueFilterClauseOp | "in";
    value?: string | string[] | number | number[] | boolean | boolean[];
  };

export const FilterClauseValueEditor = forwardRef(
  function FilterClauseValueEditor(
    {
      selectedColumn,
      operator,
      inputProps,
      onChangeValue,
      onDeselectValue,
      suggestionProvider,
      table,
      value,
    }: FilterClauseValueEditorProps,
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) {
    if (selectedColumn === undefined || operator === undefined) {
      return null;
    }

    if (isDateTimeDataValue(selectedColumn)) {
      return (
        <FilterClauseValueEditorDate
          inputProps={inputProps}
          className={cx(`${classBase}Field`, `${classBase}Value`)}
          // ref={forwardedRef}
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
            inputProps={inputProps}
            className={cx(`${classBase}Field`, `${classBase}Value`)}
            column={selectedColumn}
            onDeselect={onDeselectValue}
            onChangeValue={onChangeValue}
            operator={operator}
            ref={forwardedRef}
            suggestionProvider={suggestionProvider}
            table={table}
            value={
              value === undefined
                ? ""
                : Array.isArray(value)
                  ? value.map((val) => val.toString())
                  : (value.toString() as string | string[])
            }
          />
        );
      case "int":
      case "long":
      case "double":
        return (
          <FilterClauseValueEditorNumber
            inputProps={inputProps}
            className={cx(`${classBase}Field`, `${classBase}Value`)}
            column={selectedColumn}
            data-field="value"
            onChangeValue={onChangeValue}
            operator={operator}
            ref={forwardedRef}
          />
        );
      default:
        console.log("returning null");
        return null;
    }
  },
);
