import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import cx from "clsx";
import { useFilterClause } from "../useFilterClause";
import { FilterClauseValueEditorNumber } from "./FilterClauseValueEditorNumber";
import { FilterClauseValueEditorText } from "./FilterClauseValueEditorText";

import {
  NumericFilterClauseOp,
  SingleValueFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import { isDateTimeDataValue, isTimeDataValue } from "@vuu-ui/vuu-utils";
import { ForwardedRef, forwardRef } from "react";
import { FilterClauseValueEditorDate } from "./FilterClauseValueEditorDate";
import { FilterClauseValueEditorTime } from "./FilterClauseValueEditorTime";

const classBase = "vuuFilterClause";

type FilterClauseValueEditorProps = Pick<
  ReturnType<typeof useFilterClause>,
  | "selectedColumn"
  | "inputProps"
  | "onChangeValue"
  | "onDeselectValue"
  | "onOpenChange"
> & {
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
      onOpenChange,
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
          value={value as number}
          operator={operator as NumericFilterClauseOp}
          onChangeValue={onChangeValue}
        />
      );
    } else if (isTimeDataValue(selectedColumn)) {
      return (
        <FilterClauseValueEditorTime
          inputProps={inputProps}
          className={cx(`${classBase}Field`, `${classBase}Value`)}
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
            onOpenChange={onOpenChange}
            operator={operator}
            ref={forwardedRef}
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
