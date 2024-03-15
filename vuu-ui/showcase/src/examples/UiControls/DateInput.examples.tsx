import { DateInput, DateRangeInput } from "@finos/vuu-ui-controls";
import { CalendarDate, DateValue } from "@internationalized/date";
import { useState } from "react";

let displaySequence = 1;

export const DefaultDateInput = () => {
  const [date, setDate] = useState<DateValue>(new CalendarDate(2024, 1, 1));
  console.log(`date ${date.toString()}`);
  return (
    <DateInput
      data-showcase-center
      selectedDate={date}
      onChange={setDate}
      // hideOutOfRangeDates
      // closeOnSelection
    />
  );
};
DefaultDateInput.displaySequence = displaySequence++;

export const DefaultDateRangePicker = () => {
  const [date, setDate] = useState<{
    startDate?: DateValue;
    endDate?: DateValue;
  }>({
    startDate: new CalendarDate(2024, 1, 1),
  });

  return (
    <div style={{ width: 250 }}>
      <DateRangeInput
        selectedDateRange={date}
        onChange={setDate}
        hideOutOfRangeDates
        closeOnSelection
      />
    </div>
  );
};
DefaultDateRangePicker.displaySequence = displaySequence++;
