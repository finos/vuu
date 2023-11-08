import { DropdownBase, PriceTicker } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import { DataSource } from "@finos/vuu-data";
import { useId } from "@finos/vuu-layout";
import { DropdownBaseProps, InstrumentSearch } from "@finos/vuu-ui-controls";
import { HTMLAttributes, useCallback, useRef } from "react";

import "./BasketSelector.css";
import { useBasketSelector } from "./useBasketSelector";

const classBase = "vuuBasketSelector";

export interface BasketSelectorProps
  extends Pick<DropdownBaseProps, "defaultIsOpen" | "isOpen" | "onOpenChange">,
    HTMLAttributes<HTMLElement> {
  basketInstanceId?: string;
  dataSourceBasketTrading: DataSource;
  dataSourceBasketTradingSearch: DataSource;
  label?: string;
  onClickAddBasket: () => void;
}

export const BasketSelector = ({
  basketInstanceId,
  dataSourceBasketTrading,
  dataSourceBasketTradingSearch,
  id: idProp,
  isOpen: isOpenProp,
  onClickAddBasket,
  onOpenChange: onOpenChangeProp,
  ...htmlAttributes
}: BasketSelectorProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId(idProp);

  const { basket, isOpen, onOpenChange, tableProps } = useBasketSelector({
    basketInstanceId,
    dataSourceBasketTrading,
    dataSourceBasketTradingSearch,
    isOpen: isOpenProp,
    onOpenChange: onOpenChangeProp,
  });

  const handleClickAddBasket = useCallback(() => {
    onClickAddBasket();
  }, [onClickAddBasket]);

  return (
    <DropdownBase
      {...htmlAttributes}
      className={classBase}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
          // onClick={toggleSearch}
          variant="secondary"
        />
      </div>
      <div className={`${classBase}-searchContainer`}>
        <InstrumentSearch
          TableProps={tableProps}
          className={`${classBase}-instrumentSearch`}
          dataSource={dataSourceBasketTradingSearch}
          placeHolder="Enter Basket Name"
          searchColumns={["basketId"]}
        />
        <div className={`${classBase}-buttonBar`}>
          <Button onClick={handleClickAddBasket} variant="secondary">
            Add New Basket
          </Button>
        </div>
      </div>
    </DropdownBase>
  );
};
