import { HTMLAttributes } from "react";
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
