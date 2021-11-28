import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import SelectBase, { ComponentType } from '../select-base/select-base';
import { ChevronDownIcon } from '../icons';

import './select.css';

const classBase = 'hwSelect';

const Select = forwardRef(function Select({ value: valueProp, values = [], ...props }, ref) {
  const selector = useRef(null);
  const [value, setValue] = useState(valueProp);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (selector.current) {
        selector.current.focus(false);
      }
    }
  }));

  const handleCommit = (value) => {
    setValue(value);

    if (props.onCommit) {
      props.onCommit(value);
    }
  };

  return (
    <SelectBase
      ref={selector}
      {...props}
      values={values}
      onCommit={handleCommit}
      typeToNavigate
      value={value}
    >
      {(child) =>
        child === ComponentType.Input && (
          <div tabIndex={0} className={classBase}>
            <div className={`${classBase}-text`}>{value}</div>
            <ChevronDownIcon className={`${classBase}-icon`} />
          </div>
        )
      }
    </SelectBase>
  );
});

Select.displayName = 'Select';
export default Select;
