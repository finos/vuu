import React, { useCallback, useState } from "react";
import { getLocalTimeZone, DateValue } from "@internationalized/date";
import { DateInput } from "@finos/vuu-ui-controls";
import { toCalendarDate } from "@finos/vuu-utils";
import { NumericFilterClauseOp } from "@finos/vuu-filter-types";
import { FilterClauseValueEditor } from "../filterClauseTypes";

interface Props extends Pick<FilterClauseValueEditor, "onChangeValue"> {
  value: number | undefined;
  operator: NumericFilterClauseOp;
}

export const FilterClauseValueEditorDate: React.FC<Props> = (props) => {
  const { value, onChangeValue, operator } = props;
  const toEpochMilliS = getEpochMillisConverter(operator);

  const [date, setDate] = useState<DateValue | undefined>(() =>
    getInitialState(value)
  );

  const onSelectedDateChange = useCallback((d: DateValue | undefined) => {
    setDate(d);
  }, []);

  const onBlur = useCallback(() => {
    date && onChangeValue(toEpochMilliS(date));
  }, [date, onChangeValue, toEpochMilliS]);

  return (
    <DateInput
      className={"vuuFilterClause-DatePicker"}
      selectedDate={date}
      onBlur={onBlur}
      onChange={onSelectedDateChange}
      // closeOnSelection
      // hideOutOfRangeDates
    />
  );
};

function getInitialState(value: Props["value"]) {
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
