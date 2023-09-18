import { BasketSelector } from "../basket-selector";

import "./BasketToolbar.css";

const classBase = "vuuBasketToolbar";

export const BasketToolbar = () => {
  return (
    <div className={classBase}>
      <BasketSelector />
    </div>
  );
};
