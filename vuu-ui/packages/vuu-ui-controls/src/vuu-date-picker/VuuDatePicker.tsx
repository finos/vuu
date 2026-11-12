import { AdapterDateFns } from "@salt-ds/date-adapters/date-fns";
import {
  type DateInputSingleDetails,
  DatePicker,
  DatePickerOverlay,
  DatePickerSingleGridPanel,
  DatePickerSingleInput,
  type DatePickerSingleInputProps,
  DatePickerTrigger,
  LocalizationProvider,
} from "@salt-ds/date-components";
import {
  type CommitHandler,
  EpochTimestamp,
  fromDateTimeFields,
  type TimeZoneSpec,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

const classBase = "VuuDatePicker";

const isSameDay = (d1: Date | null, d2: Date | null) =>
  d1 !== null &&
  d2 !== null &&
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

/**
 * A local Date, at midnight, representing the calendar date of an epoch
 * value in the given time zone.
 */
const toDateInTimeZone = (
  value: EpochTimestamp | number | undefined,
  timeZone?: TimeZoneSpec,
): Date | null => {
  const timestamp =
    value instanceof EpochTimestamp
      ? value
      : EpochTimestamp.fromWire(value, "epochMillis");
  if (timestamp) {
    const { year, month, day } = timestamp.getFields(timeZone);
    return new Date(year, month - 1, day);
  }
  return null;
};

/**
 * Epoch millis of the start of the calendar date of a local Date, in the
 * given time zone.
 */
const startOfDateInTimeZone = (date: Date, timeZone?: TimeZoneSpec) =>
  fromDateTimeFields(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone,
  );

export interface VuuDatePickerProps
  extends Omit<
    DatePickerSingleInputProps,
    | "date"
    | "defaultDate"
    | "defaultValue"
    | "onDateChange"
    | "validate"
    | "value"
  > {
  /**
   * Invoked when user selects a date from the calendar, or enters a valid date
   * (Enter or blur). Not invoked when the date is unchanged. Value is epoch
   * millis at the start of the selected day, in timeZone.
   */
  onCommit?: CommitHandler<HTMLElement, number>;
  /**
   * The time zone used to convert between epoch values and calendar dates.
   * Defaults to the application default time zone (see setDefaultTimeZone).
   */
  timeZone?: TimeZoneSpec;
  /**
   * An epoch value (millis as number, or millis/nanos as EpochTimestamp). The
   * calendar date is determined in timeZone.
   */
  value?: EpochTimestamp | number;
}

/**
 * A Salt DatePicker that reads and commits epoch values. Calendar dates are
 * mapped to and from epoch values in timeZone.
 */
export const VuuDatePicker = ({
  className,
  disabled,
  onCommit,
  onDateValueChange,
  onKeyDown,
  readOnly,
  timeZone,
  value,
  ...props
}: VuuDatePickerProps) => {
  const controlledDate = useMemo(
    () => toDateInTimeZone(value, timeZone),
    [timeZone, value],
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(controlledDate);
  const [prevControlledDate, setPrevControlledDate] = useState(controlledDate);
  // The last date committed, or received from the client
  const committedDateRef = useRef<Date | null>(controlledDate);
  const inputTextRef = useRef("");
  const invalidRef = useRef(false);

  if (
    controlledDate !== null &&
    !isSameDay(controlledDate, prevControlledDate)
  ) {
    // value has been changed by client
    setPrevControlledDate(controlledDate);
    setSelectedDate(controlledDate);
    committedDateRef.current = controlledDate;
  }

  const handleSelectionChange = useCallback(
    (
      _e: SyntheticEvent,
      date: Date | null,
      details?: DateInputSingleDetails,
    ) => {
      setSelectedDate(date);
      invalidRef.current = (details?.errors?.length ?? 0) > 0;
    },
    [],
  );

  const handleApply = useCallback(
    (e: SyntheticEvent, date: Date | null) => {
      if (date !== null && !isSameDay(date, committedDateRef.current)) {
        committedDateRef.current = date;
        onCommit?.(
          e as SyntheticEvent<HTMLElement>,
          startOfDateInTimeZone(date, timeZone),
        );
      }
    },
    [onCommit, timeZone],
  );

  const handleDateValueChange = useCallback<
    NonNullable<DatePickerSingleInputProps["onDateValueChange"]>
  >(
    (e, text) => {
      inputTextRef.current = text;
      onDateValueChange?.(e, text);
    },
    [onDateValueChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      // An invalid typed entry has not been committed, the Enter must not
      // reach a container that would treat it as a commit.
      if (
        e.key === "Enter" &&
        inputTextRef.current !== "" &&
        invalidRef.current
      ) {
        e.stopPropagation();
      }
    },
    [onKeyDown],
  );

  return (
    <LocalizationProvider DateAdapter={AdapterDateFns}>
      <DatePicker
        disabled={disabled}
        onApply={handleApply}
        onSelectionChange={handleSelectionChange}
        readOnly={readOnly}
        selectedDate={selectedDate}
        selectionVariant="single"
      >
        <DatePickerTrigger>
          <DatePickerSingleInput
            {...props}
            className={cx(classBase, className)}
            onDateValueChange={handleDateValueChange}
            onKeyDown={handleKeyDown}
          />
        </DatePickerTrigger>
        <DatePickerOverlay>
          <DatePickerSingleGridPanel />
        </DatePickerOverlay>
      </DatePicker>
    </LocalizationProvider>
  );
};
