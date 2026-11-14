import { Badge, Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  HoverOverlay,
  HoverOverlayProps,
  IconButton,
} from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { ReactNode, useCallback, useState } from "react";

import filterSummaryButtonCss from "./FilterSummaryButton.css";

const classBase = "vuuFilterSummaryButton";

export interface FilterSummaryButtonProps
  extends Pick<HoverOverlayProps, "placement"> {
  "aria-label"?: string;
  appearance?: "solid" | "transparent";
  /**
   * Content of the hover overlay, a description of the filter in effect.
   */
  children: ReactNode;
  className?: string;
  /**
   * Number of filter clauses in effect, shown as a badge. When zero, there
   * is no badge and no overlay.
   */
  clauseCount: number;
  icon: string;
  onClear: () => void;
  onClick?: () => void;
  tabIndex?: number;
}

/**
 * An icon button that shows, as a badge, how many filter clauses are in
 * effect. Hovering it shows the filter in effect, with a Clear All button.
 */
export const FilterSummaryButton = ({
  "aria-label": ariaLabel,
  appearance = "solid",
  children,
  className,
  clauseCount,
  icon,
  onClear,
  onClick,
  placement,
  tabIndex,
}: FilterSummaryButtonProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-summary-button",
    css: filterSummaryButtonCss,
    window: targetWindow,
  });

  const [open, setOpen] = useState(false);

  const handleClear = useCallback(() => {
    onClear();
    setOpen(false);
  }, [onClear]);

  const iconButton = (
    <IconButton
      appearance={appearance}
      aria-label={ariaLabel}
      className={cx(classBase, className)}
      icon={icon}
      onClick={onClick}
      sentiment="neutral"
      size={16}
      tabIndex={tabIndex}
    />
  );

  return clauseCount > 0 ? (
    <Badge
      className={cx(`${classBase}-badge`, className && `${className}-badge`)}
      value={clauseCount}
    >
      <HoverOverlay
        onOpenChange={setOpen}
        open={open}
        placement={placement}
        trigger={iconButton}
      >
        <div
          className={cx(
            `${classBase}-overlay-panel`,
            className && `${className}-overlay`,
          )}
        >
          <div className={`${classBase}-overlay-header`}>
            {`Filters (${clauseCount})`}
          </div>
          {children}
          <div className={`${classBase}-overlay-footer`}>
            <Button onClick={handleClear} sentiment="neutral">
              Clear All
            </Button>
          </div>
        </div>
      </HoverOverlay>
    </Badge>
  ) : (
    iconButton
  );
};
