import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useFreezeControl, type FreezeProps } from "./useFreezeControl";
import { HTMLAttributes, useEffect, useRef, useState } from "react";
import cx from "clsx";

import freezeControlCss from "./FreezeControl.css";

// Duration to keep flashing after last new record (in milliseconds)
const FLASH_DURATION_MS = 3000;

export interface FreezeControlProps
  extends HTMLAttributes<HTMLDivElement>,
    FreezeProps {
  /**
   * Duration of the flash animation for the badge (in seconds).
   * @default 0.25
   */
  flashDuration?: number;
}

export const FreezeControl = ({
  dataSource,
  className,
  flashDuration = 0.25,
  ...htmlAttributes
}: FreezeControlProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-freeze-control",
    css: freezeControlCss,
    window: targetWindow,
  });

  const { isFrozen, newRecordCount, onToggleChange } = useFreezeControl({
    dataSource,
  });

  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if we're frozen and have new records and set the flash with a 3 second timeout
  useEffect(() => {
    if (isFrozen && newRecordCount > 0) {
      setIsFlashing(true);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
      }, FLASH_DURATION_MS);
    }
  }, [newRecordCount, isFrozen]);

  return (
    <div
      {...htmlAttributes}
      className={cx("FreezeControl", className)}
      style={
        {
          ...htmlAttributes.style,
          "--freeze-control-flash-duration": `${flashDuration}s`,
        } as React.CSSProperties
      }
    >
      <div className={`FreezeControl-buttonRow`}>
        <ToggleButtonGroup
          className="vuuStateButtonGroup"
          onChange={onToggleChange}
          value={isFrozen ? "frozen" : "live"}
        >
          <div
            className={cx(`FreezeControl-buttonWrapper`, {
              [`FreezeControl-buttonWrapper-active`]: isFrozen,
            })}
          >
            <ToggleButton value="frozen">
              {isFrozen ? "Frozen" : "Freeze"}
            </ToggleButton>
          </div>
          <div
            className={cx(`FreezeControl-buttonWrapper`, {
              [`FreezeControl-buttonWrapper-active`]: !isFrozen,
            })}
          >
            <ToggleButton value="live">Active</ToggleButton>
          </div>
        </ToggleButtonGroup>
        {isFrozen && (
          <div className={`FreezeControl-newOrders`}>
            New Orders
            <div
              className={cx(`FreezeControl-customBadge`, {
                [`FreezeControl-customBadge-flashing`]: isFlashing,
              })}
            >
              {newRecordCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
