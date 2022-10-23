import React, { FocusEvent, forwardRef, HTMLAttributes, useState } from "react";
import cx from "classnames";

import "./button.css";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  element?: string;
  variant?: string;
}

export const Button = forwardRef(function Button(
  {
    active,
    children,
    className,
    element = "button",
    onBlur,
    onClick,
    onFocus,
    ...htmlAttributes
  }: ButtonProps,
  ref
) {
  const classBase = "hwButton";
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: FocusEvent<HTMLButtonElement>) => {
    setFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e: FocusEvent<HTMLButtonElement>) => {
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
        hwFocusVisible: focused,
      }),
      ref,
      onBlur: handleBlur,
      onClick,
      onFocus: handleFocus,
    },
    children
  );
});

Button.displayName = "Button";
