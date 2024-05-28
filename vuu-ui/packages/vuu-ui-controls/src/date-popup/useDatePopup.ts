import { useCallback, useMemo, useRef, useState } from "react";
import { OpenChangeHandler } from "../dropdown-base";
import { DateValue } from "@internationalized/date";
import { DatePopupProps } from "./DatePopup";

const SELECTED_DAY =
  ".saltCalendarDay-selected:not(.saltCalendarDay-outOfRange)";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export interface DatePopupHookProps
  extends Pick<DatePopupProps, "onPopupClose" | "onPopupOpen">,
    WithRequired<DatePopupProps, "onChange" | "selectedDate"> {}

export const useDatePopup = ({
  onChange,
  onPopupClose,
  onPopupOpen,
  selectedDate,
}: // selectionVariant,
DatePopupHookProps) => {
  const [date, setDate] = useState<DateValue>(selectedDate);
  const [, forceUpdate] = useState({});
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const triggererRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const visibleMonthRef = useRef<DateValue>(selectedDate);
  const setVisibleMonth = useMemo(() => {
    const setValue = (v: DateValue) => {
      if (v.toString() !== visibleMonthRef.current.toString()) {
        visibleMonthRef.current = v;
        forceUpdate({});
      }
    };
    setValue(selectedDate);
    return setValue;
  }, [selectedDate]);

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, reason) => {
      setIsOpen(open);
      if (open) {
        onPopupOpen?.();
        requestAnimationFrame(() => {
          const el = calendarRef.current?.querySelector(
            SELECTED_DAY
          ) as HTMLElement;
          el?.focus();
        });
      } else {
        if (reason !== "Tab") {
          triggererRef.current?.focus();
        }
        onPopupClose?.(reason);
      }
    },
    [onPopupClose, onPopupOpen]
  );

  const handleDateSelection = useCallback(
    (e, date) => {
      setDate(date);
      console.log(date.toString());
      visibleMonthRef.current = date;
      handleOpenChange(false, "select");
      onChange(date);
    },
    [handleOpenChange, onChange]
  );

  const handleVisibleMonthChange = useCallback(
    (e, date) => {
      setVisibleMonth(date);
    },
    [setVisibleMonth]
  );

  return {
    calendarRef,
    date,
    handleOpenChange: handleOpenChange,
    isOpen,
    onSelectedDateChange: handleDateSelection,
    onVisibleMonthChange: handleVisibleMonthChange,
    triggererRef,
    visibleMonth: visibleMonthRef.current,
  };
};
