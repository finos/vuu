import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '../calendar';
import { SelectBase, ComponentType } from '../select-base';

import './date-picker.css';

const YYYY_DD_MM = 'yyyy-MM-dd';
const formatDate = (date) => format(date, YYYY_DD_MM);

const defaultValues = [
  '2018-12-18',
  '2018-12-19',
  '2018-12-20',
  '2018-12-21',
  '2018-12-22',
  '2018-12-23',
  '2018-12-24'
];

export default forwardRef(function DatePicker(
  { onCommit, values = defaultValues, value = '', ...props },
  ref
) {
  const root = useRef(null);
  const [state, setState] = useState({ values, value });

  useImperativeHandle(ref, () => ({ focus }));

  function focus() {
    console.log(`DataPicker focus`);
    if (root.current) {
      root.current.focus(false);
    }
  }

  const handleCommit = (value) => {
    setState({
      value,
      values
    });

    onCommit && onCommit(formatDate(parseISO(value)));
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setState({ value, values: matchingValues(value) });
  };

  function matchingValues(text) {
    const pattern = new RegExp(`^${text}`, 'i');
    return values.filter((value) => pattern.test(value));
  }

  console.log({ value: state.value });

  return (
    <SelectBase
      {...props}
      dropdownClassName="hwCalendar-dropdown"
      ref={root}
      value={state.value}
      source={state.values}
      onChange={handleChange}
      onCommit={handleCommit}
      valueFormatter={formatDate}>
      {(child, childProps) =>
        child === ComponentType.Input ? (
          <input
            {...childProps}
            type="text"
            className="hwDatePicker"
            onChange={handleChange}
            value={state.value}
          />
        ) : child === ComponentType.Dropdown ? (
          <Calendar {...childProps} value={state.value}>
            {(formattedDate) => <span className="calendar-day">{formattedDate}</span>}
          </Calendar>
        ) : null
      }
    </SelectBase>
  );
});
