import { Button } from "@salt-ds/core";
import { HTMLAttributes } from "react";

import "./EmptyBasketsPanel.css";

const classBase = "vuuBasketEmptyBasketsPanel";

export interface EmptyBasketsPanelProps extends HTMLAttributes<HTMLDivElement> {
  onClickAddBasket: () => void;
}

export const EmptyBasketsPanel = ({
  onClickAddBasket,
}: EmptyBasketsPanelProps) => {
  return (
    <div className={classBase}>
      <span className={`${classBase}-info`}>
        You do not have any baskets set up
      </span>
      <Button
        className={`${classBase}-add`}
        variant="cta"
        onClick={onClickAddBasket}
      >
        Add Basket
        <span data-icon="add" />
      </Button>
    </div>
  );
};
