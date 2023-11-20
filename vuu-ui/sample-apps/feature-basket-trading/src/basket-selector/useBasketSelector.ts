import { TableRowClickHandler } from "@finos/vuu-datagrid-types";
import { TableProps } from "@finos/vuu-table";
import { OpenChangeHandler, useControlled } from "@finos/vuu-ui-controls";
import { buildColumnMap } from "@finos/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
import { BasketSelectorProps } from "./BasketSelector";
import { BasketSelectorRow } from "./BasketSelectorRow";

export type BasketSelectorHookProps = Pick<
  BasketSelectorProps,
  | "basketInstanceId"
  | "dataSourceBasketTradingSearch"
  | "defaultIsOpen"
  | "isOpen"
  | "onOpenChange"
  | "onClickAddBasket"
  | "onSelectBasket"
>;

export const useBasketSelector = ({
  basketInstanceId,
  dataSourceBasketTradingSearch,
  defaultIsOpen,
  isOpen: isOpenProp,
  onClickAddBasket,
  onOpenChange,
  onSelectBasket,
}: BasketSelectorHookProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const columnMap = useMemo(
    () => buildColumnMap(dataSourceBasketTradingSearch.columns),
    [dataSourceBasketTradingSearch.columns]
  );

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      setIsOpen(open);
      onOpenChange?.(open, closeReason);
      if (open === false) {
        dataSourceBasketTradingSearch.disable?.();
        if (closeReason !== "Tab") {
          setTimeout(() => {
            triggerRef.current?.focus();
          }, 100);
        }
      }
    },
    [dataSourceBasketTradingSearch, onOpenChange, setIsOpen]
  );

  const handleRowClick = useCallback<TableRowClickHandler>(
    (row) => {
      const instanceId = row[columnMap.instanceId] as string;
      handleOpenChange(false, "select");
      onSelectBasket?.(instanceId);
    },
    [columnMap.instanceId, handleOpenChange, onSelectBasket]
  );

  const handleClickAddBasket = useCallback(() => {
    handleOpenChange(false, "script");
    onClickAddBasket();
  }, [handleOpenChange, onClickAddBasket]);

  const tableProps: Partial<TableProps> = useMemo(
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
      selectedKeys: basketInstanceId ? [basketInstanceId] : undefined,
    }),
    [basketInstanceId, handleRowClick]
  );

  return {
    isOpen,
    onClickAddBasket: handleClickAddBasket,
    onOpenChange: handleOpenChange,
    tableProps,
    triggerRef,
  };
};
