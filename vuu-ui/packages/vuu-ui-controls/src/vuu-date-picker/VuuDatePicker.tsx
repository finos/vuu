import {
  type CommitHandler,
  EpochTimestamp,
  fromDateTimeFields,
  type TimeZoneSpec,
} from "@vuu-ui/vuu-utils";
import { CalendarDate, type DateValue } from "@internationalized/date";
import cx from "clsx";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { SingleSelectionValueType } from "../calendar";
import { DatePicker, DatePickerProps } from "../date-picker";

const classBase = "VuuDatePicker";

const datePattern = /^\d{1,2} [a-z]{3} \d{4}$/i;
const isValidDate = (value?: string) =>
  value !== undefined &&
  value.match(datePattern) !== null &&
  !Number.isNaN(new Date(value).getDay());

const isSameDate = (d1: DateValue, d2?: DateValue) =>
  d2 !== undefined && d1.compare(d2) === 0;

/**
 * The calendar date of an epoch value, in the given time zone
 */
const toCalendarDateInTimeZone = (
  value: EpochTimestamp | number | undefined,
  timeZone?: TimeZoneSpec,
): CalendarDate | undefined => {
  const timestamp =
    value instanceof EpochTimestamp
      ? value
      : EpochTimestamp.fromWire(value, "epochMillis");
  if (timestamp) {
    const { year, month, day } = timestamp.getFields(timeZone);
    return new CalendarDate(year, month, day);
  }
};

/**
 * Epoch millis of the start of the given date, in the given time zone.
 */
const startOfDateInTimeZone = (date: DateValue, timeZone?: TimeZoneSpec) =>
  fromDateTimeFields(
    {
      year: date.year,
      month: date.month,
      day: date.day,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone,
  );

export interface VuuDatePickerProps
  extends Omit<
    DatePickerProps<SingleSelectionValueType>,
    "defaultSelectedDate" | "onChange"
  > {
  /**
   * Invoked when user selects a date from the calendar, or enters a valid date and
   * presses Enter. Value is epoch millis at the start of the selected day, in timeZone.
   */
  onCommit?: CommitHandler<HTMLElement, number>;
  preserveFocusOnSelect?: boolean;
  /**
   * The time zone used to convert between epoch values and calendar dates.
   * Defaults to the application default time zone (see setDefaultTimeZone).
   */
  timeZone?: TimeZoneSpec;
  /**
   * An epoch value (millis as number, or millis/nanos as EpochTimestamp). An
   * alternative to selectedDate, when the date is derived from a timestamp. The
   * calendar date is determined in timeZone.
   */
  value?: EpochTimestamp | number;
}

export const VuuDatePicker = ({
  className,
  onSelectionChange,
  onCommit,
  preserveFocusOnSelect,
  selectedDate: selectedDateProp,
  timeZone,
  value,
  ...props
}: VuuDatePickerProps) => {
  const [open, setOpen] = useState(false);
  const inputValueRef = useRef("");
  const datePickerRef = useRef<HTMLDivElement>(null);

  const controlledDate = useMemo(
    () => selectedDateProp ?? toCalendarDateInTimeZone(value, timeZone),
    [selectedDateProp, timeZone, value],
  );
  const [selectedDate, setSelectedDate] = useState<DateValue | undefined>(
    controlledDate,
  );
  const controlledDateRef = useRef(controlledDate);
  if (
    controlledDate !== undefined &&
    (controlledDateRef.current === undefined ||
      controlledDate.compare(controlledDateRef.current) !== 0)
  ) {
    // value has been changed by client
    controlledDateRef.current = controlledDate;
    if (!isSameDate(controlledDate, selectedDate)) {
      setSelectedDate(controlledDate);
    }
  }

  const commitDateChange = useCallback(
    (e: SyntheticEvent<Element>, date: DateValue) => {
      onSelectionChange?.(e, date);
      setOpen(false);
      onCommit?.(
        e as SyntheticEvent<HTMLElement>,
        startOfDateInTimeZone(date, timeZone),
      );

      if (preserveFocusOnSelect) {
        requestAnimationFrame(() => {
          datePickerRef.current?.querySelector("input")?.focus();
        });
      }
    },
    [onCommit, onSelectionChange, preserveFocusOnSelect, timeZone],
  );

  const handleSelectionChange = useCallback(
    (e: SyntheticEvent<Element>, date?: DateValue) => {
      // if date is undefined, we're opening the picker on an empty field
      if (date && !isSameDate(date, selectedDate)) {
        setSelectedDate(date);
        commitDateChange(e, date);
      }
    },
    [commitDateChange, selectedDate],
  );

  const handleChange = (_evt: ChangeEvent<HTMLInputElement>, value = "") => {
    inputValueRef.current = value;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      setOpen(true);
    }
  };

  const handleKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
    // Prevent an invalid typed entry being committed
    if (
      e.key === "Enter" &&
      inputValueRef.current !== "" &&
      !isValidDate(inputValueRef.current)
    ) {
      e.stopPropagation();
    }
  };

  // The DatePicker is controlled once we have a date, uncontrolled (allowing
  // user to type freely) until then.
  return (
    <DatePicker
      {...props}
      className={cx(classBase, className)}
      key={selectedDate ? "controlled" : "uncontrolled"}
      open={open}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyDownCapture={handleKeyDownCapture}
      onOpenChange={setOpen}
      ref={datePickerRef}
      onSelectionChange={(e, date) =>
        handleSelectionChange(e, date as DateValue | undefined)
      }
      selectedDate={selectedDate}
    />
  );
};
