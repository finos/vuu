import { useCallback, useRef, useState } from "react";
import { DateValue } from "@internationalized/date";
import { PickerSelectionType } from "./types";
import { BaseDatePickerDropdownProps } from "./types";

type Props<T extends PickerSelectionType> = Pick<
  BaseDatePickerDropdownProps<T>,
  "onSelectedDateChange" | "onVisibleMonthChange"
> & {
  shouldCloseOnSelectionChange: (v: T) => boolean;
};

export function useBaseDatePickerDropdown<T extends PickerSelectionType>({
  onVisibleMonthChange,
  onSelectedDateChange,
  shouldCloseOnSelectionChange,
}: Props<T>) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const triggererRef = useRef<HTMLButtonElement>(null);

  const handleDateSelection = useCallback(
    (_: React.SyntheticEvent, d: T) => {
      onSelectedDateChange(d);
      if (shouldCloseOnSelectionChange(d)) setIsOpen(false);
      triggererRef.current?.focus();
    },
    [onSelectedDateChange, shouldCloseOnSelectionChange]
  );

  const handleVisibleMonthChange = useCallback(
    (_: React.SyntheticEvent, d: DateValue) => {
      onVisibleMonthChange(d);
      triggererRef.current?.focus();
    },
    [onVisibleMonthChange]
  );

  return {
    isOpen,
    handleOpenChange: setIsOpen,
    triggererRef,
    handleVisibleMonthChange,
    handleDateSelection,
  };
}
