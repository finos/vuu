import { toCalendarDate } from "@finos/vuu-utils";
import { DateValue } from "@internationalized/date";
import { clsx } from "clsx";
import {
  HTMLAttributes,
  KeyboardEventHandler,
  useCallback,
  useRef,
} from "react";
import { CalendarProps } from "../calendar/Calendar";
import { DatePopup } from "../date-popup";
import { useDatePicker } from "./useDatePicker";

import "./DateInput.css";

const classBase = "vuuDateInput";

export interface DateInputProps
  extends Pick<CalendarProps, "hideOutOfRangeDates" | "hideYearDropdown">,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  onChange: (selected: DateValue) => void;
  selectedDate: DateValue | undefined;
  closeOnSelection?: boolean;
  onBlur?: () => void;
  className?: string;
}

export const DateInput = ({
  selectedDate,
  onChange,
  onBlur,
  className,
  ...htmlAttributes
}: DateInputProps) => {
  const { handleOnBlur } = useDatePicker({ onBlur });
  const popupRef = useRef<HTMLButtonElement>(null);
  const onInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const v = e.target.value;
      if (v === "") return;
      else onChange(toCalendarDate(new Date(v)));
    },
    [onChange]
  );

  const onKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>((e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      console.log({ button: popupRef.current });
      requestAnimationFrame(() => {
        popupRef.current?.focus();
      });
    }
  }, []);

  return (
    <div
      {...htmlAttributes}
      className={clsx(classBase, className)}
      onBlur={handleOnBlur}
    >
      <input
        aria-label="date-input"
        className={clsx("saltInput-input", classBase, className)}
        type="date"
        value={selectedDate?.toString() ?? ""}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        max="9999-12-31" // without this it shows expty space on the right
      />

      <DatePopup
        data-embedded
        onBlur={onBlur}
        onChange={onChange}
        ref={popupRef}
        selectedDate={selectedDate}
        selectionVariant="default"
      />
    </div>
  );
};
