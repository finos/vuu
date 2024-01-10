import { Button } from "@salt-ds/core";
import { CalendarIcon } from "@salt-ds/icons";
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef } from "react";
import clsx from "clsx";

import "./CalendarIconButton.css";

const baseClass = "vuuDatePicker-calendarIconButton";

export const CalendarIconButton = forwardRef(function CalendarIconButton(
  { className, ...rest }: ComponentPropsWithoutRef<typeof Button>,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <Button
      className={clsx(baseClass, className)}
      variant={"secondary"}
      aria-label="calendar-icon-button"
      ref={ref}
      {...rest}
    >
      <CalendarIcon />
    </Button>
  );
});
