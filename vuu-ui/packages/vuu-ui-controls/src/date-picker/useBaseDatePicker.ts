import { useCallback, useState } from "react";
import { BaseDatePickerProps } from "./types";
import { DateValue } from "@internationalized/date";
import { PickerSelectionType } from "./types";
import { RangeSelectionValueType } from "../calendar";

type InheritedProps<T extends PickerSelectionType> = Pick<
  BaseDatePickerProps<T>,
  "onBlur" | "selectedDate"
>;
type Props =
  | ({ variant: "range" } & InheritedProps<RangeSelectionValueType>)
  | ({ variant: "default" } & InheritedProps<DateValue>);

export function useBaseDatePicker(props: Props) {
  const { onBlur } = props;
  const [visibleMonth, setVisibleMonth] = useState<DateValue | undefined>(
    props.variant === "default"
      ? props.selectedDate
      : props.selectedDate?.startDate
  );

  const handleOnBlur: React.FocusEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        onBlur?.();
      }
    },
    [onBlur]
  );

  return {
    handleOnBlur,
    visibleMonth,
    handleVisibleMonthChange: setVisibleMonth,
  };
}
