import { ComponentPropsWithRef, forwardRef } from "react";
import { clsx } from "clsx";
import { makePrefixer } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import { daysForLocale } from "./utils";

import calendarWeekHeaderCss from "./CalendarWeekHeader.css";

export type CalendarWeekHeaderProps = ComponentPropsWithRef<"div">;

const withBaseName = makePrefixer("saltCalendarWeekHeader");

export const CalendarWeekHeader = forwardRef<
  HTMLDivElement,
  CalendarWeekHeaderProps
>(function CalendarWeekHeader({ className, ...rest }, ref) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "salt-calendar-month",
    css: calendarWeekHeaderCss,
    window: targetWindow,
  });

  const weekdaysShort = daysForLocale("narrow");
  const weekdaysLong = daysForLocale("long");

  return (
    <div
      data-testid="CalendarWeekHeader"
      className={clsx(withBaseName(), className)}
      ref={ref}
      {...rest}
    >
      {weekdaysShort.map((day, index) => (
        <small
          aria-hidden="true"
          key={weekdaysLong[index]}
          className={withBaseName("dayOfWeek")}
        >
          {day}
        </small>
      ))}
    </div>
  );
});
