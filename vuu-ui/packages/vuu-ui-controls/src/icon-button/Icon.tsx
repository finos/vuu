import { HTMLAttributes } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import iconCss from "./Icon.css";

const classBase = "vuuIcon";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number;
}

export const Icon = ({
  className,
  name,
  size,
  style: styleProp,
  ...htmlAttributes
}: IconProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-icon",
    css: iconCss,
    window: targetWindow,
  });

  const style =
    typeof size === "number"
      ? { ...styleProp, "--vuu-icon-size": `${size}px` }
      : styleProp;
  return (
    <span
      {...htmlAttributes}
      className={cx(classBase, className)}
      data-icon={name}
      role="img"
      style={style}
    />
  );
};
