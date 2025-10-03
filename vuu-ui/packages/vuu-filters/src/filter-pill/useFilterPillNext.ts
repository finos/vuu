import type { VirtualElement } from "@floating-ui/react";
import { useControlled } from "@salt-ds/core";
import { MouseEventHandler, useCallback, useMemo, useState } from "react";
import { FilterMenuActionHandler } from "./FilterMenu";
import { getFilterAsFormattedText } from "./getFilterTooltipText";
import { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";

export interface FilterPillNextHookProps {
  active?: boolean;
  /**
   * Determines how menu items will be presented
   * 'button' - menu items will be context menu
   * 'split-button' - menu items will be dropdowns
   */
  appearence?: "split-button" | "button";
  defaultActive?: boolean;
  filter: FilterContainerFilter;
  onMenuAction?: FilterMenuActionHandler;
}

export const useFilterPillNext = ({
  active: activeProp,
  appearence = "button",
  defaultActive,
  filter,
  onMenuAction,
}: FilterPillNextHookProps) => {
  const [active] = useControlled({
    controlled: activeProp,
    default: defaultActive ?? false,
    name: "FilterPillNext",
    state: "active",
  });

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [virtualElement, setVirtualElement] = useState<VirtualElement | null>(
    null,
  );

  const tooltipText = useMemo(() => {
    const getTooltipText = getFilterAsFormattedText();
    return getTooltipText(filter);
  }, [filter]);

  const onContextMenu: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (appearence === "button") {
      setVirtualElement({
        getBoundingClientRect: () => ({
          width: 0,
          height: 0,
          x: e.clientX,
          y: e.clientY,
          top: e.clientY,
          right: e.clientX,
          bottom: e.clientY,
          left: e.clientX,
        }),
      });
      setContextMenuOpen(true);
    }
  };

  const handleMenuAction = useCallback<FilterMenuActionHandler>(
    (filterId, actionType) => {
      setContextMenuOpen(false);
      onMenuAction?.(filterId, actionType);
    },
    [onMenuAction],
  );

  return {
    active,
    contextMenuOpen,
    onContextMenu,
    onContextMenuOpenChange: setContextMenuOpen,
    onMenuAction: handleMenuAction,
    tooltipText,
    virtualElement,
  };
};
