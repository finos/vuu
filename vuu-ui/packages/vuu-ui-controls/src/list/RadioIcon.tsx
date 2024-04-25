import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import radioIconCss from "./RadioIcon.css";

const classBase = "vuuRadioIcon";

export const RadioIcon = ({ checked = false, ...htmlAttributes }) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-radio-icon",
    css: radioIconCss,
    window: targetWindow,
  });

  return (
    <span
      {...htmlAttributes}
      className={cx(classBase, { [`${classBase}-checked`]: checked })}
    />
  );
};
