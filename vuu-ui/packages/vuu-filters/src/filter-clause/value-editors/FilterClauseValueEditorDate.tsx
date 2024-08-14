import React, {
  useCallback,
  useState,
} from "react";
import cx from "clsx";
import { getLocalTimeZone, DateValue } from "@internationalized/date";
import { CommitHandler, toCalendarDate } from "@finos/vuu-utils";
import { NumericFilterClauseOp } from "@finos/vuu-filter-types";
import { FilterClauseValueEditor } from "../filterClauseTypes";
import { VuuDatePicker } from "@finos/vuu-ui-controls";

interface FilterClauseValueEditorDateProps
  extends Pick<FilterClauseValueEditor, "onChangeValue" | "inputProps"> {
  className?: string;
  value: number | undefined;
  operator: NumericFilterClauseOp;
}

export const FilterClauseValueEditorDate = (
  props: FilterClauseValueEditorDateProps,
) => {
  const { inputProps, className, onChangeValue, operator, value } = props;
  const toEpochMilliS = getEpochMillisConverter(operator);

  const [date, setDate] = useState<DateValue | undefined>(() =>
    getInitialState(value),
  );

  const handleCommit = useCallback<CommitHandler<HTMLElement, number>>(
    (e, selectedDateInputValue) => {
      console.log("change date");
      if (selectedDateInputValue) {
        const dateValue = toCalendarDate(new Date(selectedDateInputValue));
        setDate(dateValue);
        if (selectedDateInputValue /* && source === "calendar"*/) {
          onChangeValue(toEpochMilliS(dateValue));
        }
      }
    },
    [onChangeValue, toEpochMilliS],
  );

  const onBlur = useCallback(() => {
    date && onChangeValue(toEpochMilliS(date));
  }, [date, onChangeValue, toEpochMilliS]);

  return (
    <VuuDatePicker
      inputProps={inputProps}
      className={cx("vuuFilterClause-DatePicker", className)}
      onBlur={onBlur}
      onCommit={handleCommit}
      selectedDate={date}
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
