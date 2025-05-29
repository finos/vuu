import { CommitHandler } from "@vuu-ui/vuu-utils";
import {
  DateValue,
  getLocalTimeZone,
  isSameDay,
  isSameMonth,
  isSameYear,
} from "@internationalized/date";
import cx from "clsx";
import {
  ChangeEvent,
  KeyboardEvent,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { SingleSelectionValueType } from "../calendar";
import { DatePicker, DatePickerProps } from "../date-picker";

const classBase = "VuuDatePicker";

const isSameDate = (d1: DateValue, d2?: DateValue) =>
  d2 !== undefined &&
  isSameDay(d1, d2) &&
  isSameMonth(d1, d2) &&
  isSameYear(d1, d2);

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

type DateState =
  | {
      datePickerKey: "controlled";
      defaultDate: undefined;
      selectedDate: DateValue;
    }
  | {
      datePickerKey: "uncontrolled";
      defaultDate: DateValue | undefined;
      selectedDate: undefined;
    };

const getDates = (selectedDate: DateValue | undefined): DateState => {
  if (selectedDate) {
    return {
      datePickerKey: "controlled",
      defaultDate: undefined,
      selectedDate,
    };
  } else {
    return {
      datePickerKey: "uncontrolled",
      defaultDate: undefined,
      selectedDate,
    };
  }
};

export const VuuDatePicker = ({
  className,
  onSelectionChange,
  selectedDate: selectedDateProp,
  onCommit,
  preserveFocusOnSelect,
  ...props
}: Omit<DatePickerProps<SingleSelectionValueType>, "defaultSelectedDate"> & {
  onCommit?: CommitHandler<HTMLElement, number>;
  preserveFocusOnSelect?: boolean;
}) => {
  const [open, _setOpen] = useState(false);
  const valueRef = useRef("");
  const datePickerRef = useRef<HTMLDivElement>(null);

  const dateState = useRef<DateState>(getDates(selectedDateProp));

  const setOpen = (o: boolean) => {
    console.log(`setOpen ${o}`);
    _setOpen(o);
  };

  const commitDateChange = useCallback(
    (e: SyntheticEvent<Element>, date: DateValue) => {
      onSelectionChange?.(e, date);
      setOpen(false);
      onCommit?.(
        e as SyntheticEvent<HTMLElement>,
        toEpochMillis(date, localTimeZone),
      );

      if (preserveFocusOnSelect) {
        requestAnimationFrame(() => {
          datePickerRef.current?.querySelector("input")?.focus();
        });
      }
    },
    [onCommit, onSelectionChange, preserveFocusOnSelect],
  );

  const handleSelectionChange = useCallback(
    (e: SyntheticEvent<Element>, date: DateValue) => {
      const { selectedDate } = dateState.current;
      // id date is undefined, we're openung the picker on an empty field
      if (date) {
        if (selectedDate === undefined) {
          dateState.current = getDates(date);
          commitDateChange(e, date);
        } else if (!isSameDate(date, selectedDate)) {
          dateState.current.selectedDate = date;
          commitDateChange(e, date);
        }
      }
    },
    [commitDateChange],
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

  const { datePickerKey, defaultDate, selectedDate } = dateState.current;

  return (
    <DatePicker
      {...props}
      className={cx(classBase, className)}
      defaultSelectedDate={defaultDate}
      key={datePickerKey}
      open={open}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyDownCapture={handleKeyDownCapture}
      onOpenChange={setOpen}
      ref={datePickerRef}
      onSelectionChange={(e, date) =>
        handleSelectionChange(e, date as DateValue)
      }
      selectedDate={selectedDate}
    />
  );
};
