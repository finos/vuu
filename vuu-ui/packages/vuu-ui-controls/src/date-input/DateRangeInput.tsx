import { toCalendarDate } from "@finos/vuu-utils";
import cx from "clsx";
import { ChangeEventHandler, HTMLAttributes, useCallback } from "react";
import { CalendarProps, RangeSelectionValueType } from "../calendar";
import { DatePopup } from "../date-popup";
import { useDatePicker } from "./useDatePicker";

import "./DateInput.css";

const classBase = "vuuDateInput";

export interface DateRangeInputProps
  extends Pick<CalendarProps, "hideOutOfRangeDates" | "hideYearDropdown">,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: (selectedDateRange: RangeSelectionValueType) => void;
  selectedDateRange: RangeSelectionValueType | undefined;
  closeOnSelection?: boolean;
  onBlur?: () => void;
  className?: string;
}

export const DateRangeInput = ({
  selectedDateRange,
  onChange,
  className,
  onBlur,
}: DateRangeInputProps) => {
  const { handleOnBlur } = useDatePicker({ onBlur });

  const getHandleInputChange = useCallback(
    (k: keyof RangeSelectionValueType): ChangeEventHandler<HTMLInputElement> =>
      (e) => {
        const v = e.target.value;
        onChange({ ...selectedDateRange, [k]: toCalendarDate(new Date(v)) });
      },
    [selectedDateRange, onChange]
  );

  const handleDateInputChange = useCallback(
    (dateRange: RangeSelectionValueType) => {
      console.log("date range change", {
        dateRange,
      });
    },
    []
  );

  return (
    <div
      className={cx("saltInput saltInput-primary", classBase, className)}
      onBlur={handleOnBlur}
    >
      <input
        className={cx("saltInput-input", classBase, className)}
        type="date"
        value={selectedDateRange?.["startDate"]?.toString() ?? ""}
        onChange={getHandleInputChange("startDate")}
        aria-label="date-input"
        max="9999-12-31" // without this it shows expty space on the right
      />
      <span>—</span>
      <input
        className={cx("saltInput-input", classBase, className)}
        type="date"
        value={selectedDateRange?.["endDate"]?.toString() ?? ""}
        onChange={getHandleInputChange("endDate")}
        aria-label="date-input"
        max="9999-12-31" // without this it shows expty space on the right
      />

      <DatePopup
        onBlur={onBlur}
        onChange={handleDateInputChange as any}
        selectedDate={selectedDateRange?.["startDate"]}
        selectionVariant="range"
      />
    </div>
  );
};
