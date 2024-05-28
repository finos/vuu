import { HTMLAttributes } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import checkboxIconCss from "./CheckboxIcon.css";

const classBase = "vuuCheckboxIcon";

export interface CheckboxIconProps extends HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
  disabled?: boolean;
}
export const CheckboxIcon = ({
  checked = false,
  disabled = false,
  ...htmlAttributes
}: CheckboxIconProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-icon",
    css: checkboxIconCss,
    window: targetWindow,
  });

  return (
    <span
      {...htmlAttributes}
      className={cx(classBase, {
        [`${classBase}-checked-${disabled ? "disabled" : "enabled"}`]: checked,
      })}
    />
  );
};
