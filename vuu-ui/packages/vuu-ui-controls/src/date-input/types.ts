import { DateValue } from "@internationalized/date";
import { CalendarProps } from "../calendar/Calendar";
import { RangeSelectionValueType } from "../calendar";
import { HTMLAttributes } from "react";

export type PickerSelectionType = DateValue | RangeSelectionValueType;

export interface BaseDatePickerProps<T = PickerSelectionType>
  extends Pick<CalendarProps, "hideOutOfRangeDates" | "hideYearDropdown">,
    HTMLAttributes<HTMLDivElement> {
  onSelectedDateChange: (selected: T) => void;
  selectedDate: T | undefined;
  closeOnSelection?: boolean;
  onBlur?: () => void;
  className?: string;
}

export interface BaseDatePickerDropdownProps<T = PickerSelectionType>
  extends BaseDatePickerProps<T> {
  visibleMonth: DateValue | undefined;
  onVisibleMonthChange: (d: DateValue) => void;
}
