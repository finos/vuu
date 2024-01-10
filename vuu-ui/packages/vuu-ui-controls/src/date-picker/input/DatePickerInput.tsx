import React, { useCallback } from "react";
import { DateValue, CalendarDate } from "@internationalized/date";
import { clsx } from "clsx";
import { BasePickerInputProps } from "./types";

import "./DatePickerInput.css";

const baseClass = "vuuDatePickerInput";

type Props = BasePickerInputProps<DateValue>;

export const DatePickerInput: React.FC<Props> = (props) => {
  const { value, onChange, className } = props;

  const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const v = e.target.value;
      if (v === "") return;
      else onChange(toCalendarDate(new Date(v)));
    },
    [onChange]
  );

  return (
    <input
      className={clsx("saltInput-input", baseClass, className)}
      type="date"
      value={value?.toString() ?? ""}
      onChange={onInputChange}
      aria-label="date-input"
      max="9999-12-31" // without this it shows expty space on the right
    />
  );
};

function toCalendarDate(d: Date): CalendarDate {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
