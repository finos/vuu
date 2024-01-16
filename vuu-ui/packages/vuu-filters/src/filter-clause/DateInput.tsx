import React, { useCallback, useState } from "react";
import { getLocalTimeZone, DateValue } from "@internationalized/date";
import { DatePicker } from "@finos/vuu-ui-controls";
import { toCalendarDate } from "@finos/vuu-utils";
import { NumericFilterClauseOp } from "@finos/vuu-filter-types";
import { FilterClauseValueEditor } from "./filterClauseTypes";

interface Props
  extends Pick<FilterClauseValueEditor<number>, "onInputComplete"> {
  value: number | undefined;
  operator: NumericFilterClauseOp;
}

export const DateInput: React.FC<Props> = (props) => {
  const { value, onInputComplete, operator } = props;
  const toEpochMilliS = getEpochMillisConverter(operator);

  const [date, setDate] = useState<DateValue | undefined>(() =>
    getInitialState(value)
  );

  const onSelectedDateChange = useCallback((d: DateValue | undefined) => {
    setDate(d);
  }, []);

  const onBlur = useCallback(() => {
    date && onInputComplete(toEpochMilliS(date));
  }, [date, onInputComplete, toEpochMilliS]);

  return (
    <DatePicker
      className={"vuuFilterClause-DatePicker"}
      selectedDate={date}
      onBlur={onBlur}
      onSelectedDateChange={onSelectedDateChange}
      closeOnSelection
      hideOutOfRangeDates
    />
  );
};

function getInitialState(value: Props["value"]) {
  return value ? toCalendarDate(new Date(value)) : undefined;
}

const getEpochMillisConverter =
  (op: NumericFilterClauseOp) =>
  (date: DateValue, timezone?: string): number => {
    const d = date.toDate(timezone ?? getLocalTimeZone());
    switch (op) {
      case ">":
      case "<=":
        d.setHours(23, 59, 59, 999);
        return d.getTime();
      case ">=":
      case "<":
      case "=":
      case "!=":
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }
  };
