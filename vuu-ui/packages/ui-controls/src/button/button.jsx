import React, { forwardRef, useState } from 'react';
import cx from 'classnames';
import './button.css';

const Button = forwardRef(function Button(
  { active, children, className, element = 'button', onBlur, onClick, onFocus, ...htmlAttributes },
  ref
) {
  const classBase = 'hwButton';
  const [focused, setFocused] = useState(false);

  const handleFocus = (e) => {
    setFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur && onBlur(e);
  };

  // Needed if we support other tags as Button
  // const handleKeyUp = (e) => {
  //   if (e.key === 'Enter' && e.target === e.currentTarget) {
  //     onClick?.(e);
  //   }
  // };

  return React.createElement(
    element,
    {
      ...htmlAttributes,
      className: cx(classBase, className, {
        [`${classBase}-active`]: active,
        hwFocusVisible: focused
      }),
      ref,
      onBlur: handleBlur,
      onClick,
      onFocus: handleFocus
    },
    children
  );
});
export default Button;
