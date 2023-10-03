import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import { BasketSelector, BasketSelectorProps } from "../basket-selector";

import "./BasketToolbar.css";

const classBase = "vuuBasketToolbar";

export interface BasketToolbarProps extends HTMLAttributes<HTMLDivElement> {
  BasketSelectorProps: BasketSelectorProps;
}

export const BasketToolbar = ({ BasketSelectorProps }: BasketToolbarProps) => {
  return (
    <div className={classBase}>
      <BasketSelector {...BasketSelectorProps} />
      <FormField>
        <FormFieldLabel>Units</FormFieldLabel>
        <Input value={100} />
      </FormField>
      <FormField>
        <FormFieldLabel>Total USD Not</FormFieldLabel>
        <span className={`${classBase}-notionalUSD`}>1,235,789</span>
      </FormField>
      <FormField>
        <FormFieldLabel>Total Not</FormFieldLabel>
        <span className={`${classBase}-notional`}>2,345,678</span>
      </FormField>
    </div>
  );
};
