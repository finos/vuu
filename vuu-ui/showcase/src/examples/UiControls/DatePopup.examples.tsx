import {
  DatePopup,
  DatePopupProps,
  DropdownCloseHandler,
} from "@finos/vuu-ui-controls";
import {
  CalendarDate,
  DateValue,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { useCallback, useState } from "react";

let displaySequence = 1;

const tz = getLocalTimeZone();
const _today = today(tz);
console.log({ tz, _today });

export const DefaultDatePopup = () => {
  const [date, setDate] = useState<DateValue>(new CalendarDate(2024, 2, 8));

  const onChange: DatePopupProps["onChange"] = (dt) => {
    console.log(`handleSelectedDateChange date = ${date.toString()}`);
    setDate(dt);
  };

  const handlePopupClose = useCallback<DropdownCloseHandler>((reason) => {
    console.log(`handlePopupClose ${reason}`);
  }, []);

  return (
    <DatePopup
      data-showcase-center
      selectedDate={date}
      onChange={onChange}
      onPopupClose={handlePopupClose}
      selectionVariant="default"
    />
  );
};
DefaultDatePopup.displaySequence = displaySequence++;

export const EmbeddedDatePopup = () => {
  const [date, setDate] = useState<DateValue>(new CalendarDate(2024, 2, 8));

  const onChange: DatePopupProps["onChange"] = (dt) => {
    console.log(`handleSelectedDateChange date = ${date.toString()}`);
    setDate(dt);
  };

  const handlePopupClose = useCallback<DropdownCloseHandler>((reason) => {
    console.log(`handlePopupClose ${reason}`);
  }, []);

  return (
    <DatePopup
      data-embedded
      data-showcase-center
      selectedDate={date}
      onChange={onChange}
      onPopupClose={handlePopupClose}
      selectionVariant="default"
    />
  );
};
EmbeddedDatePopup.displaySequence = displaySequence++;
