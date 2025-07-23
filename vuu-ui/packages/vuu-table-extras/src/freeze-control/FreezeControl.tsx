import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Badge, Switch } from "@salt-ds/core";
import freezeControlCss from "./FreezeControl.css";
import { useFreezeControl, type FreezeProps } from "./useFreezeControl";
import { HTMLAttributes } from "react";
import cx from "clsx";

const classBase = "FreezeControl";

export interface FreezeControlProps
  extends HTMLAttributes<HTMLDivElement>,
    FreezeProps {}

export const FreezeControl = ({
  dataSource,
  className,
  ...htmlAttributes
}: FreezeControlProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-freeze-control",
    css: freezeControlCss,
    window: targetWindow,
  });

  const { label, isFrozen, lastUpdateMessage, newRecordCount, onSwitchChange } =
    useFreezeControl({ dataSource });

  return (
    <Badge value={newRecordCount} max={99}>
      <div
        {...htmlAttributes}
        className={cx(classBase, className, {
          [`${classBase}-showBadge`]: newRecordCount > 0,
        })}
      >
        <span className={`${classBase}-label`}>{label}</span>
        <Switch
          checked={isFrozen}
          onChange={onSwitchChange}
          className="vuuLarge"
        />
        <span className={`${classBase}-lastUpdated`}>{lastUpdateMessage}</span>
      </div>
    </Badge>
  );
};
