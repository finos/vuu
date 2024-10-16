import { TableRowClickHandler } from "@finos/vuu-table-types";
import { TableProps } from "@finos/vuu-table";
import { useCallback, useMemo, useState } from "react";
import { BasketSelectorProps } from "./BasketSelector";
import { BasketSelectorRow } from "./BasketSelectorRow";
import {
  flip,
  size,
  useClick,
  useDismiss,
  useInteractions,
} from "@floating-ui/react";
import { useFloatingUI } from "@salt-ds/core";

export type BasketSelectorHookProps = Pick<
  BasketSelectorProps,
  | "basketInstanceId"
  | "dataSourceBasketTradingSearch"
  | "onClickAddBasket"
  | "onSelectBasket"
>;

export const useBasketSelector = ({
  onClickAddBasket,
  onSelectBasket,
}: BasketSelectorHookProps) => {
  const [open, setOpen] = useState(false);

  const { context, elements, ...floatingUIProps } = useFloatingUI({
    open,
    onOpenChange: setOpen,
    placement: "bottom",
    strategy: "fixed",
    middleware: [
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxHeight: `max(calc(${availableHeight}px - var(--salt-spacing-100)), calc((var(--salt-size-base) + var(--salt-spacing-100)) * 5))`,
          });
        },
      }),
      flip({ fallbackStrategy: "initialPlacement" }),
    ],
  });

  const interactionPropGetters = useInteractions([
    useDismiss(context),
    useClick(context, { keyboardHandlers: false, toggle: false }),
  ]);

  const handleRowClick = useCallback<TableRowClickHandler>(
    (_evt, row) => {
      const instanceId = row.data.instanceId as string;
      setOpen(false);
      onSelectBasket?.(instanceId);
    },
    [onSelectBasket],
  );

  const handleClickAddBasket = useCallback(() => {
    setOpen(false);
    onClickAddBasket();
  }, [onClickAddBasket]);

  const TableProps: Partial<TableProps> = useMemo(
    () => ({
      height: "auto",
      Row: BasketSelectorRow,
      config: {
        columns: [
          { name: "instanceId", width: 380 },
          { name: "basketId", width: 100, hidden: true },
          {
            name: "name",
            width: 200,
            hidden: true,
          },
          {
            name: "basketName",
            width: 100,
            type: {
              name: "string",
            },
            hidden: true,
          },
          {
            name: "status",
            width: 100,
            type: {
              name: "string",
            },
            hidden: true,
          },
        ],
      },
      onRowClick: handleRowClick,
      rowHeight: 47,
      tabIndex: -1,
    }),
    [handleRowClick],
  );

  return {
    floatingUIProps,
    interactionPropGetters,
    onClickAddBasket: handleClickAddBasket,
    open,
    TableProps,
  };
};
