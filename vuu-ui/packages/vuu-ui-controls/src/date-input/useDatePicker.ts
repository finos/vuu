import { useCallback } from "react";

export interface DatePickerHookProps {
  onBlur?: () => void;
}

export function useDatePicker({ onBlur }: DatePickerHookProps) {
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
  };
}
