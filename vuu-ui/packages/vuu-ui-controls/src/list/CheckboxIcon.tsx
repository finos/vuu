// TODO why do we need explicit React import - its not needed anywhere else
// but we see a 'React is not defined' issue in showcase without it
import React, { HTMLAttributes } from "react";
import cx from "clsx";

import "./CheckboxIcon.css";

const classBase = "vuuCheckboxIcon";

export interface CheckboxIconProps extends HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
  disabled?: boolean;
}
export const CheckboxIcon = ({
  checked = false,
  disabled = false,
  ...htmlAttributes
}: CheckboxIconProps) => (
  <span
    {...htmlAttributes}
    className={cx(classBase, {
      [`${classBase}-checked-${disabled ? "disabled" : "enabled"}`]: checked,
    })}
  />
);
