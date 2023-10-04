import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { ExpandoInput } from "@finos/vuu-ui-controls";
import { HTMLAttributes } from "react";
import { BasketSelector, BasketSelectorProps } from "../basket-selector";
import { BasketStatus } from "../VuuBasketTradingFeature";
import { BasketMenu } from "./BasketMenu";

import "./BasketToolbar.css";
import { MenuActionHandler } from "packages/vuu-data-types";

const classBase = "vuuBasketToolbar";

export interface BasketToolbarProps extends HTMLAttributes<HTMLDivElement> {
  basketStatus: BasketStatus;
  BasketSelectorProps: BasketSelectorProps;
  onSendToMarket: () => void;
  onTakeOffMarket: () => void;
}

export const BasketToolbar = ({
  basketStatus,
  BasketSelectorProps,
  onSendToMarket,
  onTakeOffMarket,
}: BasketToolbarProps) => {
  const handleMenuAction: MenuActionHandler = () => {
    console.log("Menu Action");
    return true;
  };

  const basketSelector = <BasketSelector {...BasketSelectorProps} />;
  const statusIndicator = <span className={`${classBase}-statusIndicator`} />;
  const inputUnits = (
    <FormField>
      <FormFieldLabel>Units</FormFieldLabel>
      <ExpandoInput className={`${classBase}-units`} value={100} />
    </FormField>
  );
  const readOnlyUnits = (
    <FormField>
      <FormFieldLabel>Units</FormFieldLabel>
      <span className={`${classBase}-units`}>100</span>
    </FormField>
  );
  const notionalUSD = (
    <FormField>
      <FormFieldLabel>Total USD Not</FormFieldLabel>
      <span className={`${classBase}-notional`}>1,235,789</span>
    </FormField>
  );

  const notional = (
    <FormField>
      <FormFieldLabel>Total Not</FormFieldLabel>
      <span className={`${classBase}-notional`}>2,345,678</span>
    </FormField>
  );

  const pctFilled = (
    <FormField>
      <FormFieldLabel>% Filled</FormFieldLabel>
      <span className={`${classBase}-notional`}>25%</span>
    </FormField>
  );

  const basketMenu = <BasketMenu onMenuAction={handleMenuAction} />;

  const sendToMarket = (
    <Button
      className={`${classBase}-sendToMarket`}
      variant="cta"
      onClick={onSendToMarket}
    >
      send to market
      <span data-icon="arrow-right" />
    </Button>
  );

  const takeOffMarket = (
    <Button
      className={`${classBase}-takeOffMarket`}
      variant="primary"
      onClick={onTakeOffMarket}
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
