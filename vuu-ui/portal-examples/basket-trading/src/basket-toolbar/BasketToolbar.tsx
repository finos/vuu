import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import type { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { TableCellEditHandler } from "@vuu-ui/vuu-table-types";
import {
  CycleStateButton,
  ExpandoInput,
  Icon,
  useEditableText,
} from "@vuu-ui/vuu-ui-controls";
import type { CommitHandler } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { type HTMLAttributes, useCallback } from "react";
import { BasketSelector, type BasketSelectorProps } from "../basket-selector";
import type { Basket } from "../useBasketTrading";
import type { BasketStatus } from "../VuuBasketTradingFeature";
import { BasketMenu } from "./BasketMenu";

import "./BasketToolbar.css";

const classBase = "vuuBasketToolbar";

const formatNotional = (notional?: number) => {
  if (notional === undefined) {
    return "";
  } else {
    return notional.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
};

export type BasketChangeHandler = (
  columnName: string,
  value: VuuRowDataItemType,
) => unknown;
export interface BasketToolbarProps extends HTMLAttributes<HTMLDivElement> {
  basket?: Basket;
  basketStatus: BasketStatus;
  BasketSelectorProps: BasketSelectorProps;
  onCommit?: BasketChangeHandler;
  onSendToMarket: (basketInstanceId: string) => void;
  onTakeOffMarket: (basketInstanceId: string) => void;
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
    return true;
  };

  const handleUnitsEdited = useCallback<TableCellEditHandler>(
    async ({ value }) => {
      if (onCommit) {
        onCommit?.("units", value as VuuRowDataItemType);
        return undefined;
      } else {
        throw Error(
          "BasketToolbar onCommit prop not supplied for editable Basket",
        );
      }
    },
    [onCommit],
  );

  // TODO use an InputCell for this
  const { warningMessage: unitErrorMessage, ...unitProps } =
    useEditableText<number>({
      value: basket?.units,
      onEdit: handleUnitsEdited,
      type: "number",
      column: { name: "units", label: "Units" },
    });

  const handleSideCommit = useCallback<CommitHandler<HTMLButtonElement>>(
    (_, value) => {
      if (onCommit) {
        return onCommit?.("side", value);
      } else {
        throw Error(
          "BasketToolbar onCommit prop not supplied for editable Basket",
        );
      }
    },
    [onCommit],
  );

  const handleSendToMarket = useCallback(() => {
    if (basket?.instanceId) {
      onSendToMarket(basket?.instanceId);
    }
  }, [basket?.instanceId, onSendToMarket]);

  const handleTakeOffMarket = useCallback(() => {
    if (basket?.instanceId) {
      onTakeOffMarket(basket?.instanceId);
    }
  }, [basket?.instanceId, onTakeOffMarket]);

  const basketSelector = (
    <BasketSelector {...BasketSelectorProps} basket={basket} key="selector" />
  );
  const readOnlyStatus = (
    <FormField className={`${classBase}-statusField`} key="status">
      <FormFieldLabel>Status</FormFieldLabel>
      <span className={`${classBase}-status`}>ON MARKET</span>
    </FormField>
  );

  const inputSide = (
    <FormField className={`${classBase}-sideField`} key="side">
      <FormFieldLabel>Side</FormFieldLabel>
      <CycleStateButton
        appearance="solid"
        aria-label={`Basket side: ${basket?.side ?? "BUY"}. Click to switch`}
        className={`${classBase}-side`}
        onCommit={handleSideCommit}
        value={basket?.side ?? ""}
        values={["BUY", "SELL"]}
        sentiment="neutral"
      />
    </FormField>
  );
  const readOnlySide = (
    <FormField className={`${classBase}-sideField`} key="side">
      <FormFieldLabel>Side</FormFieldLabel>
      <span className={`${classBase}-side`}>{basket?.side ?? ""}</span>
    </FormField>
  );

  const inputUnits = (
    <FormField className={`${classBase}-unitsField`} key="units">
      <FormFieldLabel>Units</FormFieldLabel>
      <ExpandoInput
        {...unitProps}
        className={`${classBase}-units`}
        errorMessage={unitErrorMessage}
      />
    </FormField>
  );
  const readOnlyUnits = (
    <FormField className={`${classBase}-unitsField`} key="units">
      <FormFieldLabel>Units</FormFieldLabel>
      <span className={`${classBase}-units`}>{basket?.units ?? ""}</span>
    </FormField>
  );
  const notionalUSD = (
    <FormField className={`${classBase}-notionalUsdField`} key="usd">
      <FormFieldLabel>Notional (USD)</FormFieldLabel>
      <span className={`${classBase}-notional`}>
        {formatNotional(basket?.totalNotionalUsd)}
      </span>
    </FormField>
  );

  const notional = (
    <FormField className={`${classBase}-notionalField`} key="notional">
      <FormFieldLabel>Notional (local)</FormFieldLabel>
      <span className={`${classBase}-notional`}>
        {formatNotional(basket?.totalNotional)}
      </span>
    </FormField>
  );

  const pctFilled = (
    <FormField className={`${classBase}-pctFilledField`} key="filled">
      <FormFieldLabel>% Filled</FormFieldLabel>
      <span className={`${classBase}-pctFilled`}>
        {basket?.pctFilled === undefined
          ? ""
          : `${basket.pctFilled.toFixed(1)}%`}
      </span>
    </FormField>
  );

  const basketMenu = (
    <BasketMenu
      className={`${classBase}-actions`}
      key="menu"
      onMenuAction={handleMenuAction}
    />
  );

  const sendToMarket = (
    <Button
      className={`${classBase}-sendToMarket`}
      key="to-market"
      onClick={handleSendToMarket}
      appearance="solid"
      sentiment="accented"
      disabled={!basket?.instanceId}
    >
      Send to market
      <Icon name="arrow-right" />
    </Button>
  );

  const takeOffMarket = (
    <Button
      className={`${classBase}-takeOffMarket`}
      key="off-market"
      onClick={handleTakeOffMarket}
      appearance="bordered"
      sentiment="neutral"
      disabled={!basket?.instanceId}
    >
      Take off market
    </Button>
  );

  const marketActions = (
    <div className={`${classBase}-marketActions`} key="market-actions">
      {basketMenu}
      {takeOffMarket}
    </div>
  );

  const getToolbarItems = () => {
    const designing = basketStatus === "design";
    return [
      basketSelector,
      <div className={`${classBase}-tradeControls`} key="trade-controls">
        {designing ? null : readOnlyStatus}
        {designing ? inputSide : readOnlySide}
        {designing ? inputUnits : readOnlyUnits}
      </div>,
      <div className={`${classBase}-metrics`} key="metrics">
        {notionalUSD}
        {notional}
        {designing ? null : pctFilled}
      </div>,
      designing ? sendToMarket : marketActions,
    ];
  };

  return (
    <div className={cx(classBase, `${classBase}-${basketStatus}`)}>
      <div className={`${classBase}-inner`}>{getToolbarItems()}</div>
    </div>
  );
};
