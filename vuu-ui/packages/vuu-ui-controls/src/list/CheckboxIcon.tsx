// TODO why do we need explicit React import - its not needed anywhere else
// but we see a 'React is not defined' issue in showcase without it
import React, { HTMLAttributes } from "react";
import cx from "classnames";

import "./CheckboxIcon.css";

const classBase = "vuuCheckboxIcon";

export interface CheckboxIconProps extends HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
}
export const CheckboxIcon = ({
  checked = false,
  ...htmlAttributes
}: CheckboxIconProps) => (
  <span
    {...htmlAttributes}
    className={cx(classBase, { [`${classBase}-checked`]: checked })}
  />
);
