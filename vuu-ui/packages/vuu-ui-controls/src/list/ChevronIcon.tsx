import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";

import chevronIconCss from "./ChevronIcon.css";

const classBase = "vuuChevronIcon";

type Direction = "up" | "down" | "left" | "right";

interface ChevronProps extends HTMLAttributes<HTMLSpanElement> {
  direction: Direction;
}

export const ChevronIcon = (props: ChevronProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checron-icon",
    css: chevronIconCss,
    window: targetWindow,
  });

  const { direction, ...htmlAttributes } = props;
  return <span {...htmlAttributes} className={cx(classBase, direction)} />;
};
