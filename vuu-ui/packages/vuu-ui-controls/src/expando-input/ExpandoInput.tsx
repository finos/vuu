import { Input, InputProps } from "@salt-ds/core";
import cx from "classnames";
import { ForwardedRef, forwardRef } from "react";

import "./ExpandoInput.css";

const classBase = "vuuExpandoInput";

export const ExpandoInput = forwardRef(function ExpandoInput(
  { className: classNameProp, value, ...inputProps }: InputProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  return (
    <div className={cx(classBase, classNameProp)} data-text={value}>
      <Input
        {...inputProps}
        inputProps={{ className: `${classBase}-input` }}
        ref={forwardedRef}
        style={{ padding: 0 }}
        textAlign="left"
        value={value}
        variant="secondary"
      />
    </div>
  );
});
