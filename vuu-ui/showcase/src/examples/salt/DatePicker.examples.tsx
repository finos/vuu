import { DatePicker } from "@finos/vuu-ui-controls";
import {
  getLocalTimeZone,
  today,
  type DateValue,
} from "@internationalized/date";
import { useState } from "react";
import { VuuDatePicker } from "@finos/vuu-ui-controls";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import { CommitHandler } from "@finos/vuu-utils";

let displaySequence = 1;

const tz = getLocalTimeZone();
const _today = today(tz);

export const DefaultDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState<DateValue>(_today);

  const setDate = (date: DateValue) => {
    setSelectedDate(date);
  };

  return (
    <DatePicker
      selectedDate={selectedDate}
      style={{ width: 150 }}
      onSelectionChange={(_, date) => setDate(date as DateValue)}
    />
  );
};
DefaultDatePicker.displaySequence = displaySequence++;

export const DefaultVuuDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState<DateValue>(_today);

  const setDate = (date: DateValue) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleCommit: CommitHandler<HTMLElement, number> = (e, value) => {
    console.log(`commit ${value} ${new Date(value).toString()}`);
  };

  return (
    <VuuDatePicker
      onCommit={handleCommit}
      onSelectionChange={(_, date) => setDate(date as DateValue)}
      selectedDate={selectedDate}
      style={{ width: "250px" }}
    />
  );
};
DefaultVuuDatePicker.displaySequence = displaySequence++;

export const WithFormField = () => {
  return (
    <FormField style={{ width: "250px" }}>
      <FormFieldLabel>Pick a date</FormFieldLabel>
      <DefaultVuuDatePicker />
    </FormField>
  );
};
