import { HTMLAttributes } from "react";
import cx from "classnames";

import "./RadioIcon.css";

const classBase = "vuuRadioIcon";

export interface RadioIconProps extends HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
}
export const RadioIcon = ({
  checked = false,
  ...htmlAttributes
}: RadioIconProps) => (
  <span
    {...htmlAttributes}
    className={cx(classBase, { [`${classBase}-checked`]: checked })}
  />
);
