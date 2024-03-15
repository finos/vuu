import {
  DateValue,
  getLocalTimeZone,
  today as getTodayDate,
} from "@internationalized/date";
import { useForkRef } from "@salt-ds/core";
import cx from "clsx";
import { forwardRef, HTMLAttributes } from "react";
import { Calendar, CalendarProps } from "../calendar";
import { DropdownBase, DropdownCloseHandler } from "../dropdown";
import { IconButton } from "../icon-button";
import { useDatePopup } from "./useDatePopup";

const classBase = "vuuDatePopup";

export interface DatePopupProps
  extends Pick<CalendarProps, "selectionVariant">,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "onKeyDown"> {
  "data-embedded"?: boolean;
  selectedDate?: DateValue;
  onPopupClose?: DropdownCloseHandler;
  onPopupOpen?: () => void;
  onChange: (date: DateValue) => void;
}

const tz = getLocalTimeZone();
const today = getTodayDate(tz);

export const DatePopup = forwardRef<HTMLButtonElement, DatePopupProps>(
  function DatePopup(
    {
      selectedDate,
      onChange,
      onPopupClose,
      onPopupOpen,
      selectionVariant,
      "data-embedded": dataEmbedded,
      ...htmlAttributes
    },
    forwardedRef
  ) {
    const {
      calendarRef,
      date,
      isOpen,
      onSelectedDateChange,
      onVisibleMonthChange,
      handleOpenChange,
      triggererRef,
      visibleMonth,
    } = useDatePopup({
      onChange,
      onPopupClose,
      onPopupOpen,
      selectedDate: selectedDate || today,
      selectionVariant,
    });

    return (
      <DropdownBase
        {...htmlAttributes}
        className={classBase}
        isOpen={isOpen}
        placement="below"
        onOpenChange={handleOpenChange}
      >
        <IconButton
          data-embedded={dataEmbedded}
          icon="date"
          ref={useForkRef(forwardedRef, triggererRef)}
          variant="secondary"
          className={cx({ "saltButton-active": isOpen })}
        />
        <Calendar
          visibleMonth={visibleMonth}
          ref={calendarRef}
          selectedDate={date}
          selectionVariant="default"
          onSelectedDateChange={onSelectedDateChange}
          onVisibleMonthChange={onVisibleMonthChange}
          className={`${classBase}-calendar`}
        />
      </DropdownBase>
    );
  }
);
