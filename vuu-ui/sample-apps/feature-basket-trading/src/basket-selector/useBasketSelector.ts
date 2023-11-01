import { TableProps, TableRowClickHandler } from "@finos/vuu-table";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { SubscribeCallback } from "@finos/vuu-data";
import { VuuDataRow } from "@finos/vuu-protocol-types";
import { OpenChangeHandler, useControlled } from "@finos/vuu-ui-controls";
import { useCallback, useMemo, useRef, useState } from "react";
import { BasketSelectorProps } from "./BasketSelector";
import { BasketSelectorRow } from "./BasketSelectorRow";

export class Basket {
  basketId: string;
  basketName: string;
  fxRateToUsd: number;

  constructor(data: VuuDataRow, columnMap: ColumnMap) {
    this.basketId = data[columnMap.basketId] as string;
    this.basketName = data[columnMap.basketName] as string;
    this.fxRateToUsd = data[columnMap.fxRateToUsd] as number;
  }
}

export type BasketSelectorHookProps = Pick<
  BasketSelectorProps,
  | "basketInstanceId"
  | "dataSourceBasketTrading"
  | "dataSourceBasketTradingSearch"
  | "defaultIsOpen"
  | "isOpen"
  | "onOpenChange"
>;

export const useBasketSelector = ({
  basketInstanceId: basketInstanceIdProp,
  dataSourceBasketTrading,
  dataSourceBasketTradingSearch,
  defaultIsOpen,
  isOpen: isOpenProp,
  onOpenChange,
}: BasketSelectorHookProps) => {
  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const [basketInstanceId, setBasketInstanceId] = useState<string | undefined>(
    basketInstanceIdProp
  );
  const [basket, setBasket] = useState<Basket | undefined>();

  const columnMap = useMemo(
    () => buildColumnMap(dataSourceBasketTrading.columns),
    [dataSourceBasketTrading.columns]
  );

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      setIsOpen(open);
      onOpenChange?.(open, closeReason);
      if (open === false) {
        dataSourceBasketTradingSearch.unsubscribe();
      }
    },
    [dataSourceBasketTradingSearch, onOpenChange, setIsOpen]
  );

  const handleRowClick = useCallback<TableRowClickHandler>(
    (row) => {
      const instanceIdId = row[columnMap.instanceId] as string;
      setBasketInstanceId(instanceIdId);
      setIsOpen(false);
      dataSourceBasketTrading.filter = {
        filter: `instanceId = "${basketInstanceId}"`,
      };
    },
    [basketInstanceId, columnMap.instanceId, dataSourceBasketTrading, setIsOpen]
  );

  const handleData = useCallback<SubscribeCallback>(
    (message) => {
      if (message.type === "viewport-update" && message.rows?.length === 1) {
        setBasket(new Basket(message.rows[0], columnMap));
      }
    },
    [columnMap]
  );

  useMemo(() => {
    dataSourceBasketTrading.subscribe(
      {
        range: { from: 0, to: 1 },
        filter: { filter: `instanceId = "${basketInstanceId}"` },
      },
      handleData
    );
  }, [dataSourceBasketTrading, basketInstanceId, handleData]);

  const tableProps: Partial<TableProps> = useMemo(
    () => ({
      height: "auto",
      Row: BasketSelectorRow,
      config: {
        columns: [
          { name: "instanceId", width: 365 },
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
    }),
    [handleRowClick]
  );

  return {
    basket,
    isOpen,
    onOpenChange: handleOpenChange,
    tableProps,
  };
};
