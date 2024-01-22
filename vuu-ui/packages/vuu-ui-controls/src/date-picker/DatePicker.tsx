import { useCallback, useMemo } from "react";
import { DateValue, today, getLocalTimeZone } from "@internationalized/date";
import { clsx } from "clsx";
import { Calendar } from "../calendar/Calendar";
import { DatePickerInput } from "./input/DatePickerInput";
import { CalendarIconButton } from "./internal/CalendarIconButton";
import { DropdownBase } from "../dropdown";
import { useBaseDatePicker } from "./useBaseDatePicker";
import { useBaseDatePickerDropdown } from "./useBaseDatePickerDropdown";
import { BaseDatePickerDropdownProps, BaseDatePickerProps } from "./types";

import "./DatePicker.css";

const baseClass = "vuuDatePicker";

export const DatePicker = (props: BaseDatePickerProps<DateValue>) => {
  const { selectedDate, onSelectedDateChange, onBlur, className } = props;
  const { visibleMonth, handleVisibleMonthChange, handleOnBlur } =
    useBaseDatePicker({ variant: "default", selectedDate, onBlur });

  const handleInputChange = useCallback(
    (d: DateValue) => {
      onSelectedDateChange(d);
      handleVisibleMonthChange(d);
    },
    [onSelectedDateChange, handleVisibleMonthChange]
  );

  return (
    <div
      className={clsx("saltInput saltInput-primary", baseClass, className)}
      onBlur={handleOnBlur}
    >
      <DatePickerInput value={selectedDate} onChange={handleInputChange} />
      <DatePickerDropdown
        visibleMonth={visibleMonth}
        onVisibleMonthChange={handleVisibleMonthChange}
        {...props}
      />
    </div>
  );
};

const DatePickerDropdown = (props: BaseDatePickerDropdownProps<DateValue>) => {
  const {
    closeOnSelection,
    onSelectedDateChange,
    onVisibleMonthChange,
    className,
    ...rest
  } = props;

  const shouldCloseOnSelectionChange = useCallback(
    () => !!closeOnSelection,
    [closeOnSelection]
  );

  const {
    triggererRef,
    isOpen,
    handleOpenChange,
    handleVisibleMonthChange,
    handleDateSelection,
  } = useBaseDatePickerDropdown({
    onVisibleMonthChange,
    onSelectedDateChange,
    shouldCloseOnSelectionChange,
  });

  const defaultSelectedDate = useMemo(() => today(getLocalTimeZone()), []);

  return (
    <DropdownBase
      placement="below"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      className={className}
    >
      <CalendarIconButton ref={triggererRef} />
      <Calendar
        selectionVariant="default"
        onVisibleMonthChange={handleVisibleMonthChange}
        onSelectedDateChange={handleDateSelection}
        defaultSelectedDate={defaultSelectedDate}
        className={`${baseClass}-calendar`}
        {...rest}
      />
    </DropdownBase>
  );
};
