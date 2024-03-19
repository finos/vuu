import {
  Calendar,
  UseSingleSelectionCalendarProps,
} from "@finos/vuu-ui-controls";
import {
  CalendarDate,
  DateValue,
  today,
  getLocalTimeZone,
} from "@internationalized/date";
import { useEffect, useRef, useState } from "react";

let displaySequence = 1;

const tz = getLocalTimeZone();
const _today = today(tz);
console.log({ tz, _today });

export const DefaultCalendar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState<DateValue>(new CalendarDate(2024, 1, 1));
  // const hoveredDate = new CalendarDate(2024, 1, 11);

  const handleSelectedDateChange: UseSingleSelectionCalendarProps["onSelectedDateChange"] =
    (_, d) => {
      console.log(`date change`, {
        d,
      });
      setDate(d);
    };

  useEffect(() => {
    const el = ref.current?.querySelector(
      ".saltCalendarDay-selected:not(.saltCalendarDay-outOfRange)"
    ) as HTMLElement;
    el?.focus();
  }, []);

  return (
    <div style={{ padding: "1em" }}>
      <Calendar
        ref={ref}
        selectionVariant="default"
        selectedDate={date}
        visibleMonth={date}
        onSelectedDateChange={handleSelectedDateChange}
        // hoveredDate={hoveredDate}
        // onHoveredDateChange={(_, d) => console.log({ d })}
        // isDayUnselectable={isDayUnselectable}
        // hideOutOfRangeDates={true}
      />
    </div>
  );
};

DefaultCalendar.displaySequence = displaySequence++;

export const ControlledCalendar = () => {
  const [date, setDate] = useState<DateValue>(new CalendarDate(2024, 1, 1));
  const hoveredDate = new CalendarDate(2024, 1, 11);

  const isDayUnselectable = (d: DateValue) => {
    return d.compare(new CalendarDate(2024, 1, 11)) === 0;
  };

  return (
    <div style={{ padding: "1em" }}>
      <Calendar
        selectionVariant="default"
        selectedDate={date}
        onSelectedDateChange={(_, d) => setDate(d)}
        hoveredDate={hoveredDate}
        onHoveredDateChange={(_, d) => console.log({ d })}
        isDayUnselectable={isDayUnselectable}
        hideOutOfRangeDates={true}
      />
    </div>
  );
};

ControlledCalendar.displaySequence = displaySequence++;
