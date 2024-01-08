import { Calendar } from "@finos/vuu-ui-controls";
import { CalendarDate, DateValue } from "@internationalized/date";
import { useState } from "react";

let displaySequence = 1;

export const DefaultCalendar = () => {
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

DefaultCalendar.displaySequence = displaySequence++;
