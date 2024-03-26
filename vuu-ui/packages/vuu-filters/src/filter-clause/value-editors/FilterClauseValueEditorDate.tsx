import React, { KeyboardEventHandler, useCallback, useState } from "react";
import cx from "clsx";
import { getLocalTimeZone, DateValue } from "@internationalized/date";
import { DateInput, DateInputProps } from "@finos/vuu-ui-controls";
import { queryClosest, toCalendarDate } from "@finos/vuu-utils";
import { NumericFilterClauseOp } from "@finos/vuu-filter-types";
import { FilterClauseValueEditor } from "../filterClauseTypes";

interface FilterClauseValueEditorDateProps
  extends Pick<FilterClauseValueEditor, "onChangeValue" | "InputProps"> {
  className?: string;
  value: number | undefined;
  operator: NumericFilterClauseOp;
}

export const FilterClauseValueEditorDate = (
  props: FilterClauseValueEditorDateProps
) => {
  const { InputProps, className, onChangeValue, operator, value } = props;
  const toEpochMilliS = getEpochMillisConverter(operator);

  const [date, setDate] = useState<DateValue | undefined>(() =>
    getInitialState(value)
  );

  const onSelectedDateChange = useCallback<DateInputProps["onChange"]>(
    (d: DateValue | undefined, source) => {
      setDate(d);
      if (d && source === "calendar") {
        onChangeValue(toEpochMilliS(d));
      }
    },
    [onChangeValue, toEpochMilliS]
  );

  const onBlur = useCallback(() => {
    date && onChangeValue(toEpochMilliS(date));
  }, [date, onChangeValue, toEpochMilliS]);

  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (evt) => {
      if (evt.key === "Enter") {
        if (date) {
          const popup = queryClosest(evt.target, ".vuuDatePopup");
          if (popup === null) {
            onChangeValue(toEpochMilliS(date));
          }
        }
      } else if (evt.key === "Tab") {
        console.log("better handle tab");
      }
    },
    [date, onChangeValue, toEpochMilliS]
  );

  return (
    <DateInput
      inputProps={InputProps?.inputProps}
      className={cx("vuuFilterClause-DatePicker", className)}
      selectedDate={date}
      onBlur={onBlur}
      onChange={onSelectedDateChange}
      onKeyDown={handleKeyDown}
    />
  );
};

function getInitialState(value: FilterClauseValueEditorDateProps["value"]) {
  return value ? toCalendarDate(new Date(value)) : undefined;
}

const getEpochMillisConverter =
  (op: NumericFilterClauseOp) =>
  (date: DateValue, timezone: string = getLocalTimeZone()): number => {
    const d = date.toDate(timezone);
    switch (op) {
      case ">":
      case "<=":
        d.setHours(23, 59, 59, 999);
        return d.getTime();
      case ">=":
      case "<":
      case "=": // converted to "< `start of next day` and >= `start of this day`" when query is created
      case "!=": // converted to ">= `start of next day` or < `start of this day`" when query is created
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }
  };
