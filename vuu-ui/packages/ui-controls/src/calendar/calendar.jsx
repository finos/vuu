import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import { addDays, differenceInCalendarMonths, format, toDate, startOfWeek } from 'date-fns';
import CalendarModel, { getDates, getCalendarClassNames } from './calendar-model';
import { Button } from '../button';
import { useKeyboardNavigation } from './use-keyboard-navigation';

import './calendar.css';

const classBase = 'hwCalendar';

export const Calendar = forwardRef(function Calendar(
  { onCancel, onCommit, value: valueProp, ...props },
  ref
) {
  const calendarBody = useRef();
  const model = useMemo(() => {
    const date = new Date(valueProp);
    const selectedDate = date.toString() === 'Invalid Date' ? new Date() : date;
    return new CalendarModel({ currentMonth: selectedDate, selectedDate });
  }, [valueProp]);

  const weeks = getDates(model.currentMonth, model.selectedDate);
  const [state, setState] = useState({
    weeks,
    classNames: getCalendarClassNames(weeks)
  });

  const focusCurrentDate = useCallback((date) => {
    const key = format(date, 'yyyy-MM-dd');
    const dateCell = calendarBody.current.querySelector(`.hwCalendar-cell[data-day = '${key}']`);
    if (dateCell) {
      dateCell.focus();
    }
  }, []);

  useEffect(() => {
    focusCurrentDate(model.currentDate);
  }, [focusCurrentDate, model.currentDate]);

  const nextMonth = () => {
    const weeks = getDates(model.nextMonth(), model.selectedDate);
    setState({ weeks, classNames: getCalendarClassNames(weeks) });
  };

  const prevMonth = () => {
    const weeks = getDates(model.prevMonth(), model.selectedDate);
    setState({ weeks, classNames: getCalendarClassNames(weeks) });
  };

  const navigate = useCallback(
    (nextDate) => {
      const monthDiff = differenceInCalendarMonths(nextDate, model.currentDate);
      if (monthDiff) {
        const weeks =
          monthDiff > 0
            ? getDates(model.nextMonth(), model.selectedDate, model.currentMonth)
            : getDates(model.prevMonth(), model.selectedDate, null, model.currentMonth);
        setState({ weeks, classNames: getCalendarClassNames(weeks) });
      } else {
        focusCurrentDate(nextDate);
      }
    },
    [focusCurrentDate, model]
  );

  const handleKeyDown = useKeyboardNavigation({
    focusCurrentDate,
    model,
    navigate,
    onCancel,
    onCommit
  });

  const renderHeader = () => {
    const dateFormat = 'MMMM yyyy';
    const { currentMonth } = model;
    return (
      <div className={cx(`${classBase}-header`, `${classBase}-row`)}>
        <Button aria-label="prev month" data-icon onClick={prevMonth} />
        <div className="current-month">
          <span>{format(currentMonth, dateFormat)}</span>
        </div>
        <Button aria-label="next-month" data-icon onClick={nextMonth} />
      </div>
    );
  };

  const renderDaysOfWeek = () => {
    const dateFormat = 'EEEEE';
    const { currentMonth } = model;
    const days = [];
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className={`${classBase}-cell`} key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className={cx(`${classBase}-days`, `${classBase}-row`)}>{days}</div>;
  };

  const handleDateClick = useCallback(
    (day) => {
      const date = toDate(day);
      onCommit && onCommit(toDate(date));
    },
    [onCommit]
  );

  const renderDateCells = () => {
    const { children: dateRenderer } = props;
    const { classNames, weeks } = state;

    return (
      <div className={cx(`${classBase}-body`, ...classNames)} ref={calendarBody}>
        <div className={`${classBase}-body-inner-container`}>
          {weeks.map((week, idx) => (
            <div className={`${classBase}-row`} key={idx}>
              {week.days.map(({ day, formattedDate, disabled, selected, otherMonth }) => (
                <div
                  key={day}
                  tabIndex={0}
                  data-day={format(day, 'yyyy-MM-dd')}
                  className={cx(`${classBase}-cell`, {
                    disabled,
                    selected,
                    otherMonth
                  })}
                  onClick={() => handleDateClick(day)}
                  onKeyDown={handleKeyDown}
                >
                  {dateRenderer(formattedDate)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div {...props} className={classBase} ref={ref}>
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderDateCells()}
    </div>
  );
});
