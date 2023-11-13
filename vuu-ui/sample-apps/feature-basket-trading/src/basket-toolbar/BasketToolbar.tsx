import { MenuActionHandler } from "@finos/vuu-data-types";
import {
  CycleStateButton,
  CycleStateButtonProps,
  ExpandoInput,
  useEditableText,
} from "@finos/vuu-ui-controls";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import {
  CommitResponse,
  DataItemCommitHandler,
} from "packages/vuu-datagrid-types";
import { VuuRowDataItemType } from "packages/vuu-protocol-types";
import { HTMLAttributes, useCallback } from "react";
import { BasketSelector, BasketSelectorProps } from "../basket-selector";
import { Basket } from "../useBasketTrading";
import { BasketStatus } from "../VuuBasketTradingFeature";
import { BasketMenu } from "./BasketMenu";

import "./BasketToolbar.css";

const classBase = "vuuBasketToolbar";

export type BasketChangeHandler = (
  columnName: string,
  value: VuuRowDataItemType
) => CommitResponse;
export interface BasketToolbarProps extends HTMLAttributes<HTMLDivElement> {
  basket?: Basket;
  basketStatus: BasketStatus;
  BasketSelectorProps: BasketSelectorProps;
  onCommit?: BasketChangeHandler;
  onSendToMarket: () => void;
  onTakeOffMarket: () => void;
}

export const BasketToolbar = ({
  basket,
  BasketSelectorProps,
  basketStatus,
  onCommit,
  onSendToMarket,
  onTakeOffMarket,
}: BasketToolbarProps) => {
  const handleMenuAction: MenuActionHandler = () => {
    console.log("Menu Action");
    return true;
  };

  const handleUnitsEdited = useCallback<DataItemCommitHandler>(
    (value) => {
      if (onCommit) {
        return onCommit?.("units", value);
      } else {
        throw Error(
          "BasketToolbar onCommit prop not supplied for editable Basket"
        );
      }
    },
    [onCommit]
  );

  const { warningMessage: unitErrorMessage, ...unitProps } = useEditableText({
    initialValue: basket?.units ?? "",
    onCommit: handleUnitsEdited,
  });

  const handleSideCommit = useCallback<CycleStateButtonProps["onCommit"]>(
    (_, value) => {
      if (onCommit) {
        return onCommit?.("side", value);
      } else {
        throw Error(
          "BasketToolbar onCommit prop not supplied for editable Basket"
        );
      }
    },
    [onCommit]
  );

  const basketSelector = (
    <BasketSelector {...BasketSelectorProps} basket={basket} key="selector" />
  );
  const statusIndicator = (
    <span key="status" className={`${classBase}-statusIndicator`} />
  );
  const inputSide = (
    <FormField key="side">
      <FormFieldLabel>Side</FormFieldLabel>
      <CycleStateButton
        className={`${classBase}-side`}
        onCommit={handleSideCommit}
        value={basket?.side ?? "BUY"}
        values={["BUY", "SELL"]}
        variant="cta"
      />
    </FormField>
  );
  const readOnlySide = (
    <FormField key="side">
      <FormFieldLabel>Units</FormFieldLabel>
      <span className={`${classBase}-units`}>{basket?.side ?? ""}</span>
    </FormField>
  );
  const inputUnits = (
    <FormField key="units">
      <FormFieldLabel>Units</FormFieldLabel>
      <ExpandoInput
        errorMessage={unitErrorMessage}
        inputProps={unitProps}
        className={`${classBase}-units`}
        value={basket?.units ?? ""}
      />
    </FormField>
  );
  const readOnlyUnits = (
    <FormField key="units">
      <FormFieldLabel>Units</FormFieldLabel>
      <span className={`${classBase}-units`}>{basket?.units ?? ""}</span>
    </FormField>
  );
  const notionalUSD = (
    <FormField key="usd">
      <FormFieldLabel>Total USD Not</FormFieldLabel>
      <span className={`${classBase}-notional`}>
        {basket?.totalNotional ?? ""}
      </span>
    </FormField>
  );

  const notional = (
    <FormField key="notional">
      <FormFieldLabel>Total Not</FormFieldLabel>
      <span className={`${classBase}-notional`}>
        {basket?.totalNotionalUsd ?? ""}
      </span>
    </FormField>
  );

  const pctFilled = (
    <FormField key="filled">
      <FormFieldLabel>% Filled</FormFieldLabel>
      <span className={`${classBase}-notional`}>{basket?.filledPct ?? ""}</span>
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
      toolbarItems.push(
        inputSide,
        inputUnits,
        notionalUSD,
        notional,
        sendToMarket
      );
    } else {
      toolbarItems.push(
        statusIndicator,
        readOnlySide,
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
