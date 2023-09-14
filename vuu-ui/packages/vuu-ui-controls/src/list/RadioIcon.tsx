import cx from "classnames";

import "./RadioIcon.css";

const classBase = "vuuRadioIcon";

export const RadioIcon = ({
  checked = false,
  ...htmlAttributes
}) => (
  <span
    {...htmlAttributes}
    className={cx(classBase, { [`${classBase}-checked`]: checked })}
  />
);
