import { DataSource } from "@vuu-ui/vuu-data-types";
import { TableSearch, PriceTicker } from "@vuu-ui/vuu-ui-controls";
import { useId } from "@vuu-ui/vuu-utils";
import {
  Button,
  useFloatingComponent,
  useIdMemo,
  type FloatingComponentProps,
} from "@salt-ds/core";
import { HTMLAttributes, forwardRef } from "react";
import { Basket } from "../useBasketTrading";
import { useBasketSelector } from "./useBasketSelector";
import cx from "clsx";

import "./BasketSelector.css";

const classBase = "vuuBasketSelector";

interface FloatingBasketSelectorProps extends FloatingComponentProps {
  collapsed?: boolean;
}

export interface BasketSelectorProps extends HTMLAttributes<HTMLElement> {
  basket?: Basket;
  basketInstanceId?: string;
  dataSourceBasketTradingSearch: DataSource;
  label?: string;
  onClickAddBasket: () => void;
  onSelectBasket: (basketInstanceId: string) => void;
}

const FloatingSelector = forwardRef<
  HTMLDivElement,
  FloatingBasketSelectorProps
>(function FloatingSelector(
  { children, className, collapsed, open, ...props },
  forwardedRef,
) {
  const { Component: FloatingComponent } = useFloatingComponent();
  return (
    <FloatingComponent
      className={cx(
        `${classBase}-floating-table`,
        {
          [`${classBase}-collapsed`]: collapsed,
        },
        className,
      )}
      role="listbox"
      open={open}
      {...props}
      ref={forwardedRef}
    >
      {children}
    </FloatingComponent>
  );
});

export const BasketSelector = ({
  basket,
  basketInstanceId,
  dataSourceBasketTradingSearch,
  id: idProp,
  onClickAddBasket: onClickAddBasketProp,
  onSelectBasket,
  ...htmlAttributes
}: BasketSelectorProps) => {
  const id = useId(idProp);
  const selectorId = useIdMemo();

  const {
    floatingUIProps: { x, y, strategy, floating, reference },
    interactionPropGetters: { getFloatingProps, getReferenceProps },
    onClickAddBasket,
    open,
    TableProps,
  } = useBasketSelector({
    basketInstanceId,
    dataSourceBasketTradingSearch,
    onClickAddBasket: onClickAddBasketProp,
    onSelectBasket,
  });

  return (
    <div {...htmlAttributes} className={classBase}>
      <div className={`${classBase}-basketDetails`} ref={reference}>
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
          {...getReferenceProps()}
          className={`${classBase}-trigger`}
          data-icon="chevron-down"
          variant="secondary"
        />
      </div>
      <FloatingSelector
        {...getFloatingProps()}
        collapsed={!open}
        id={selectorId}
        open={open}
        left={x + 3}
        position={strategy}
        ref={floating}
        top={y + 3}
      >
        <div className={`${classBase}-searchContainer`}>
          <TableSearch
            TableProps={TableProps}
            autoFocus
            className={`${classBase}-instrumentSearch`}
            placeHolder="Enter Basket Name"
            searchColumns={["basketName"]}
          />
          <div className={`${classBase}-buttonBar`}>
            <Button onClick={onClickAddBasket} variant="secondary">
              Add New Basket
            </Button>
          </div>
        </div>
      </FloatingSelector>
    </div>
  );
};
