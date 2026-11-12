import { FormField, FormFieldLabel } from "@salt-ds/core";
import { AdapterDateFns } from "@salt-ds/date-adapters/date-fns";
import {
  DatePicker,
  DatePickerOverlay,
  DatePickerSingleGridPanel,
  DatePickerSingleInput,
  DatePickerTrigger,
  LocalizationProvider,
} from "@salt-ds/date-components";
import { VuuDatePicker } from "@vuu-ui/vuu-ui-controls";
import { type CommitHandler, EpochTimestamp } from "@vuu-ui/vuu-utils";
import { useState } from "react";

export const DefaultDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  return (
    <LocalizationProvider DateAdapter={AdapterDateFns}>
      <DatePicker
        onSelectionChange={(_e, date) => setSelectedDate(date as Date | null)}
        selectedDate={selectedDate}
        selectionVariant="single"
      >
        <DatePickerTrigger>
          <DatePickerSingleInput style={{ width: 150 }} />
        </DatePickerTrigger>
        <DatePickerOverlay>
          <DatePickerSingleGridPanel />
        </DatePickerOverlay>
      </DatePicker>
    </LocalizationProvider>
  );
};

export const DefaultVuuDatePicker = () => {
  const [value, setValue] = useState<number>();

  const handleCommit: CommitHandler<HTMLElement, number> = (_e, value) => {
    console.log(`commit ${value} ${EpochTimestamp.fromMillis(value)}`);
    setValue(value);
  };

  return (
    <VuuDatePicker
      onCommit={handleCommit}
      style={{ width: "250px" }}
      value={value}
    />
  );
};

export const VuuDatePickerWithValue = () => {
  const [value, setValue] = useState<number>(() => Date.now());

  const handleCommit: CommitHandler<HTMLElement, number> = (_e, value) => {
    console.log(`commit ${value} ${EpochTimestamp.fromMillis(value)}`);
    setValue(value);
  };

  return (
    <VuuDatePicker
      onCommit={handleCommit}
      style={{ width: "250px" }}
      value={value}
    />
  );
};

export const WithFormField = () => {
  return (
    <FormField style={{ width: "250px" }}>
      <FormFieldLabel>Pick a date</FormFieldLabel>
      <DefaultVuuDatePicker />
    </FormField>
  );
};
