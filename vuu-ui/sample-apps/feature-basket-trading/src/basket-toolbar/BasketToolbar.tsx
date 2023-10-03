import { DataSource } from "@finos/vuu-data";
import { HTMLAttributes } from "react";
import { BasketSelector } from "../basket-selector";

import "./BasketToolbar.css";

const classBase = "vuuBasketToolbar";

export interface BasketToolbarProps extends HTMLAttributes<HTMLDivElement> {
  dataSource: DataSource;
}

export const BasketToolbar = ({ dataSource }: BasketToolbarProps) => {
  console.log({ dataSource });
  return (
    <div className={classBase}>
      <BasketSelector />
    </div>
  );
};
