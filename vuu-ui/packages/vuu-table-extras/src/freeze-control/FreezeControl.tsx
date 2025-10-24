import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import freezeControlCss from "./FreezeControl.css";
import { useFreezeControl, type FreezeProps } from "./useFreezeControl";
import { HTMLAttributes, useEffect, useRef, useState } from "react";
import cx from "clsx";

const classBase = "FreezeControl";

// Class names
const CLASS_BUTTON_ROW = `${classBase}-buttonRow`;
const CLASS_BUTTON_WRAPPER = `${classBase}-buttonWrapper`;
const CLASS_BUTTON_WRAPPER_ACTIVE = `${classBase}-buttonWrapper-active`;
const CLASS_NEW_ORDERS = `${classBase}-newOrders`;
const CLASS_CUSTOM_BADGE = `${classBase}-customBadge`;
const CLASS_CUSTOM_BADGE_FLASHING = `${classBase}-customBadge-flashing`;

// Duration to keep flashing after last new record (in milliseconds)
const FLASH_DURATION_MS = 3000;

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
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <div className={CLASS_BUTTON_ROW}>
        <ToggleButtonGroup
          className="vuuStateButtonGroup"
          onChange={onToggleChange}
          value={isFrozen ? "frozen" : "live"}
        >
          <div
            className={cx(CLASS_BUTTON_WRAPPER, {
              [CLASS_BUTTON_WRAPPER_ACTIVE]: !isFrozen,
            })}
          >
            <ToggleButton value="live">Live</ToggleButton>
          </div>
          <div
            className={cx(CLASS_BUTTON_WRAPPER, {
              [CLASS_BUTTON_WRAPPER_ACTIVE]: isFrozen,
            })}
          >
            <ToggleButton value="frozen">
              {isFrozen ? "Frozen" : "Freeze"}
            </ToggleButton>
          </div>
        </ToggleButtonGroup>
        {isFrozen && (
          <div className={CLASS_NEW_ORDERS}>
            New Orders
            <div
              className={cx(CLASS_CUSTOM_BADGE, {
                [CLASS_CUSTOM_BADGE_FLASHING]: isFlashing,
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
