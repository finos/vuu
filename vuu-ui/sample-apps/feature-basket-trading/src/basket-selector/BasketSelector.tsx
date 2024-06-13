import { DataSource } from "@finos/vuu-data-types";
import {
  DropdownBase,
  DropdownBaseProps,
  InstrumentSearch,
  PriceTicker,
} from "@finos/vuu-ui-controls";
import { useId } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { HTMLAttributes, useRef } from "react";
import { Basket } from "../useBasketTrading";
import { useBasketSelector } from "./useBasketSelector";

import "./BasketSelector.css";

const classBase = "vuuBasketSelector";

export interface BasketSelectorProps
  extends Pick<DropdownBaseProps, "defaultIsOpen" | "isOpen" | "onOpenChange">,
    HTMLAttributes<HTMLElement> {
  basket?: Basket;
  basketInstanceId?: string;
  dataSourceBasketTradingSearch: DataSource;
  label?: string;
  onClickAddBasket: () => void;
  onSelectBasket: (basketInstanceId: string) => void;
}

export const BasketSelector = ({
  basket,
  basketInstanceId,
  dataSourceBasketTradingSearch,
  id: idProp,
  isOpen: isOpenProp,
  onClickAddBasket: onClickAddBasketProp,
  onOpenChange: onOpenChangeProp,
  onSelectBasket,
  ...htmlAttributes
}: BasketSelectorProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId(idProp);

  const { isOpen, onClickAddBasket, onOpenChange, TableProps, triggerRef } =
    useBasketSelector({
      basketInstanceId,
      dataSourceBasketTradingSearch,
      isOpen: isOpenProp,
      onClickAddBasket: onClickAddBasketProp,
      onOpenChange: onOpenChangeProp,
      onSelectBasket,
    });

  return (
    <DropdownBase
      {...htmlAttributes}
      PopupProps={{ minWidth: 400 }}
      className={classBase}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="below-right"
      ref={rootRef}
    >
      <div className={`${classBase}-basketDetails`}>
        <label className={`${classBase}-label`} id={`${id}-name`}>
          Basket Name
        </label>
        <label className={`${classBase}-label`} id={`${id}-symbol`}>
          Symbol
        </label>
        <label className={`${classBase}-label`} id={`${id}-exchange`}>
          GBP to USD
        </label>
        <span
          className={`${classBase}-basketName`}
          aria-labelledby={`${id}-name`}
        >
          {basket?.basketName}
        </span>
        <span
          className={`${classBase}-symbolName`}
          aria-labelledby={`${id}-symbol`}
        >
          {basket?.basketId}
        </span>
        <PriceTicker
          aria-labelledby={`${id}-exchange`}
          className={`${classBase}-exchangeRate`}
          decimals={4}
          price={basket?.fxRateToUsd}
          showArrow
        />
        <Button
          className={`${classBase}-trigger`}
          data-icon="chevron-down"
          ref={triggerRef}
          variant="secondary"
        />
      </div>
      <div className={`${classBase}-searchContainer`}>
        <InstrumentSearch
          TableProps={TableProps}
          autoFocus
          className={`${classBase}-instrumentSearch`}
          dataSource={dataSourceBasketTradingSearch}
          placeHolder="Enter Basket Name"
          searchColumns={["basketName"]}
        />
        <div className={`${classBase}-buttonBar`}>
          <Button onClick={onClickAddBasket} variant="secondary">
            Add New Basket
          </Button>
        </div>
      </div>
    </DropdownBase>
  );
};
