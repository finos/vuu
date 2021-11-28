import React from 'react';
import cx from 'classnames';
import useControlled from '@vuu-ui/react-utils/src/use-controlled';
import Button from './button';
import './state-button.css';

const classBase = 'hwStateButton';

const StateButton = ({
  checked: checkedProp,
  children,
  className: classNameProp,
  defaultChecked,
  onChange,
  ...props
}) => {
  const [checked, setChecked] = useControlled({
    controlled: checkedProp,
    default: defaultChecked ?? false
  });

  const handleClick = (evt) => {
    const newValue = !checked;
    setChecked(newValue);
    onChange && onChange(evt, newValue);
  };

  const className = cx(classBase, classNameProp, {
    [`${classBase}-checked`]: checked
  });

  return (
    <Button {...props} className={className} onClick={handleClick}>
      {children}
    </Button>
  );
};

export default StateButton;
