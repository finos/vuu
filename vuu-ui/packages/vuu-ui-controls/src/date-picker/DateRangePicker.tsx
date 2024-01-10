import { useCallback, useMemo } from "react";
import { Calendar } from "../calendar/Calendar";
import { today, getLocalTimeZone } from "@internationalized/date";
import { clsx } from "clsx";
import { DateRangePickerInput } from "./input/DateRangePickerInput";
import { BaseDatePickerDropdownProps, BaseDatePickerProps } from "./types";
import { RangeSelectionValueType } from "../calendar";
import { CalendarIconButton } from "./internal/CalendarIconButton";
import { DropdownBase } from "../dropdown";
import { useBaseDatePicker } from "./useBaseDatePicker";
import { useBaseDatePickerDropdown } from "./useBaseDatePickerDropdown";

import "./DatePicker.css";

const baseClass = "vuuDatePicker";

export const DateRangePicker = (
  props: BaseDatePickerProps<RangeSelectionValueType>
) => {
  const { selectedDate, onSelectedDateChange, className, onBlur } = props;
  const { visibleMonth, handleVisibleMonthChange, handleOnBlur } =
    useBaseDatePicker({ variant: "range", selectedDate, onBlur });

  const handleInputChange = useCallback(
    (r: RangeSelectionValueType) => {
      onSelectedDateChange(r);
      handleVisibleMonthChange(r.endDate ?? r.startDate);
    },
    [onSelectedDateChange]
  );

  return (
    <div
      className={clsx("saltInput saltInput-primary", baseClass, className)}
      onBlur={handleOnBlur}
    >
      <DateRangePickerInput value={selectedDate} onChange={handleInputChange} />
      <DateRangePickerDropdown
        {...props}
        visibleMonth={visibleMonth}
        onVisibleMonthChange={handleVisibleMonthChange}
      />
    </div>
  );
};

const DateRangePickerDropdown = (
  props: BaseDatePickerDropdownProps<RangeSelectionValueType>
) => {
  const {
    onVisibleMonthChange,
    onSelectedDateChange,
    closeOnSelection,
    className,
    ...rest
  } = props;

  const shouldCloseOnSelectionChange = useCallback(
    (r: RangeSelectionValueType) => !!(closeOnSelection && r.endDate),
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

  const defaultSelectedDate = useMemo(
    () => ({ startDate: today(getLocalTimeZone()) }),
    []
  );

  return (
    <DropdownBase
      placement="below"
      isOpen={isOpen}
      className={className}
      onOpenChange={handleOpenChange}
    >
      <CalendarIconButton ref={triggererRef} />
      <Calendar
        selectionVariant="range"
        onVisibleMonthChange={handleVisibleMonthChange}
        onSelectedDateChange={handleDateSelection}
        defaultSelectedDate={defaultSelectedDate}
        className={`${baseClass}-calendar`}
        {...rest}
      />
    </DropdownBase>
  );
};
