import {
  ChangeEvent,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { DatePicker, DatePickerProps } from "../date-picker";
import {
  DateValue,
  getLocalTimeZone,
  isSameDay,
  isSameMonth,
  isSameYear,
  today,
} from "@internationalized/date";
import { SingleSelectionValueType } from "../calendar";
import { CommitHandler } from "@finos/vuu-utils";

const isSameDate = (d1: DateValue, d2: DateValue) =>
  isSameDay(d1, d2) && isSameMonth(d1, d2) && isSameYear(d1, d2);

const datePattern = /^\d{1,2} [a-z]{3} \d{4}$/i;
const isValidDate = (value?: string) =>
  value !== undefined &&
  value?.match(datePattern) !== null &&
  !Number.isNaN(new Date(value).getDay());

const localTimeZone = getLocalTimeZone();

const toEpochMillis = (
  date: DateValue,
  timezone: string = getLocalTimeZone(),
): number => date.toDate(timezone).getTime();

export const VuuDatePicker = ({
  onSelectionChange,
  selectedDate = today(localTimeZone),
  onCommit,
  ...props
}: DatePickerProps<SingleSelectionValueType> & {
  onCommit?: CommitHandler<HTMLElement, number>;
}) => {
  const [open, setOpen] = useState(false);
  const valueRef = useRef("");

  const handleSelectionChange = useCallback(
    (e: SyntheticEvent<HTMLElement>, date: DateValue) => {
      if (date && !isSameDate(date, selectedDate)) {
        onSelectionChange?.(e, date);
        setOpen(false);
        console.log(`about to commit date ${date.toString()}`);
        onCommit?.(e, toEpochMillis(date, localTimeZone));
      }
    },
    [onCommit, onSelectionChange, selectedDate],
  );

  const handleChange = (evt: ChangeEvent<HTMLInputElement>, value = "") => {
    console.log(`handleChange`, {
      evt,
      value,
    });
    valueRef.current = value;
    console.log(`is '${value}' a valid date ? ${isValidDate(value)}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      setOpen(true);
    }
  };

  const handleKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      if (isValidDate(valueRef.current)) {
        console.log(`committayaface (${valueRef.current})`);
      } else {
        console.log(
          `nice try cowboy, but '${valueRef.current}' is nota valid date`,
        );
        e.stopPropagation();
      }
    }
  };

  return (
    <DatePicker
      {...props}
      className="VuuDatePicker"
      open={open}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyDownCapture={handleKeyDownCapture}
      onOpenChange={setOpen}
      onSelectionChange={(e, date) =>
        handleSelectionChange(e, date as DateValue)
      }
    />
  );
};
