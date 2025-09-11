import { useCallback, useState } from "react";
import { getLocalTimeZone, DateValue } from "@internationalized/date";
import { CommitHandler, toCalendarDate } from "@vuu-ui/vuu-utils";
import { NumericFilterClauseOp } from "@vuu-ui/vuu-filter-types";
import { FilterClauseValueEditor } from "../filterClauseTypes";
import { VuuTimePicker } from "@vuu-ui/vuu-ui-controls";

interface FilterClauseValueEditorTimeProps
  extends Pick<FilterClauseValueEditor, "onChangeValue" | "inputProps"> {
  className?: string;
  value: number | undefined;
  operator: NumericFilterClauseOp;
}

export const FilterClauseValueEditorTime = (
  props: FilterClauseValueEditorTimeProps,
) => {
  const { className, onChangeValue, operator, value } = props;
  const toEpochMilliS = getEpochMillisConverter(operator);

  const [date, setDate] = useState<DateValue | undefined>(() =>
    getInitialState(value),
  );

  const handleCommit = useCallback<CommitHandler<HTMLInputElement, string>>(
    (e, selectedDateInputValue) => {
      console.log("change time");
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
    <VuuTimePicker
      data-field="value"
      // inputProps={inputProps}
      className={className}
      onBlur={onBlur}
      onCommit={handleCommit}
      // selectedDate={date}
    />
  );
};

function getInitialState(value: FilterClauseValueEditorTimeProps["value"]) {
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
