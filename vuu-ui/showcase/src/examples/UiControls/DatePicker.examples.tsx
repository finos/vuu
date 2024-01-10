import { DatePicker, DateRangePicker } from "@finos/vuu-ui-controls";
import { CalendarDate, DateValue } from "@internationalized/date";
import { useState } from "react";

let displaySequence = 1;

export const DefaultDatePicker = () => {
  const [date, setDate] = useState<DateValue>(new CalendarDate(2024, 1, 1));

  const onBlur = () => console.log("onBlur");

  return (
    <div style={{ width: 250 }}>
      <DatePicker
        onBlur={onBlur}
        selectedDate={date}
        onSelectedDateChange={setDate}
        hideOutOfRangeDates
        closeOnSelection
      />
    </div>
  );
};
DefaultDatePicker.displaySequence = displaySequence++;

export const DefaultDateRangePicker = () => {
  const [date, setDate] = useState<{
    startDate?: DateValue;
    endDate?: DateValue;
  }>({
    startDate: new CalendarDate(2024, 1, 1),
  });

  return (
    <div style={{ width: 250 }}>
      <DateRangePicker
        selectedDate={date}
        onSelectedDateChange={setDate}
        hideOutOfRangeDates
        closeOnSelection
      />
    </div>
  );
};
DefaultDateRangePicker.displaySequence = displaySequence++;
