import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Switch } from "@salt-ds/core";
import freezeControlCss from "./FreezeControl.css";
import { useFreezeControl, type FreezeProps } from "./useFreezeControl";
import { HTMLAttributes } from "react";
import cx from "clsx";

const classBase = "FreezeControl";

export interface FreezeControlProps
  extends HTMLAttributes<HTMLDivElement>,
    FreezeProps {
  activeLabel?: string;
  lockedLabel?: string;
}

export const FreezeControl = ({
  activeLabel = "Active",
  dataSource,
  className,
  lockedLabel = "Locked",
  ...htmlAttributes
}: FreezeControlProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-freeze-control",
    css: freezeControlCss,
    window: targetWindow,
  });

  const { frozen, onSwitchChange } = useFreezeControl({
    dataSource,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <span className={`${classBase}-label-active`}>{activeLabel}</span>
      <Switch checked={frozen} onChange={onSwitchChange} className="vuuLarge" />
      <span className={`${classBase}-label-frozen`}>{lockedLabel}</span>
    </div>
  );
};
