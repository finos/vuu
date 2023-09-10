import { HTMLAttributes } from "react";
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
