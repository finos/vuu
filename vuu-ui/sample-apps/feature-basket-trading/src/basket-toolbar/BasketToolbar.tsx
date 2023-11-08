import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { ExpandoInput } from "@finos/vuu-ui-controls";
import { HTMLAttributes } from "react";
import { BasketSelector, BasketSelectorProps } from "../basket-selector";
import { BasketStatus } from "../VuuBasketTradingFeature";
import { BasketMenu } from "./BasketMenu";
import { MenuActionHandler } from "@finos/vuu-data-types";
import { DataSource } from "@finos/vuu-data";

import "./BasketToolbar.css";

const classBase = "vuuBasketToolbar";

export interface BasketToolbarProps extends HTMLAttributes<HTMLDivElement> {
  basketStatus: BasketStatus;
  BasketSelectorProps: BasketSelectorProps;
  basketTradingDataSource: DataSource;
  onSendToMarket: () => void;
  onTakeOffMarket: () => void;
}

export const BasketToolbar = ({
  BasketSelectorProps,
  basketStatus,
  basketTradingDataSource,
  onSendToMarket,
  onTakeOffMarket,
}: BasketToolbarProps) => {
  const handleMenuAction: MenuActionHandler = () => {
    console.log("Menu Action");
    return true;
  };

  const basketSelector = (
    <BasketSelector {...BasketSelectorProps} key="selector" />
  );
  const statusIndicator = (
    <span key="status" className={`${classBase}-statusIndicator`} />
  );
  const inputUnits = (
    <FormField key="units">
      <FormFieldLabel>Units</FormFieldLabel>
      <ExpandoInput className={`${classBase}-units`} value={100} />
    </FormField>
  );
  const readOnlyUnits = (
    <FormField key="units">
      <FormFieldLabel>Units</FormFieldLabel>
      <span className={`${classBase}-units`}>100</span>
    </FormField>
  );
  const notionalUSD = (
    <FormField key="usd">
      <FormFieldLabel>Total USD Not</FormFieldLabel>
      <span className={`${classBase}-notional`}>1,235,789</span>
    </FormField>
  );

  const notional = (
    <FormField key="notional">
      <FormFieldLabel>Total Not</FormFieldLabel>
      <span className={`${classBase}-notional`}>2,345,678</span>
    </FormField>
  );

  const pctFilled = (
    <FormField key="filled">
      <FormFieldLabel>% Filled</FormFieldLabel>
      <span className={`${classBase}-notional`}>25%</span>
    </FormField>
  );

  const basketMenu = <BasketMenu key="menu" onMenuAction={handleMenuAction} />;

  const sendToMarket = (
    <Button
      className={`${classBase}-sendToMarket`}
      key="to-market"
      onClick={onSendToMarket}
      variant="cta"
    >
      send to market
      <span data-icon="arrow-right" />
    </Button>
  );

  const takeOffMarket = (
    <Button
      className={`${classBase}-takeOffMarket`}
      key="off-market"
      onClick={onTakeOffMarket}
      variant="primary"
    >
      off market
    </Button>
  );

  const getToolbarItems = () => {
    const toolbarItems = [basketSelector];
    if (basketStatus === "design") {
      toolbarItems.push(inputUnits, notionalUSD, notional, sendToMarket);
    } else {
      toolbarItems.push(
        statusIndicator,
        readOnlyUnits,
        notionalUSD,
        notional,
        pctFilled,
        basketMenu,
        takeOffMarket
      );
    }
    return toolbarItems;
  };

  return <div className={classBase}>{getToolbarItems()}</div>;
};
