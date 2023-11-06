import { VuuDataRow } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { getSchema } from "../../schemas";

import baskets, { BasketColumnMap } from "./basket";
import basketConstituents from "./basketConstituent";

const schema = getSchema("basketTrading");

export const BasketTradingColumnMap = Object.values(
  schema.columns
).reduce<ColumnMap>((map, col, index) => {
  map[col.name] = index;
  return map;
}, {});

let instance = 1;

const data: VuuDataRow[] = [];

const createBasket = (basketId: string, basketName: string) => {
  const key = BasketColumnMap.basketId;
  const basketRow = baskets.find((basket) => basket[key] === basketId);
  const basketTradingRow = [
    basketId,
    basketName,
    0,
    0,
    `steve-${instance++}`,
    "OFF-MARKET",
    0,
    0,
    0,
  ];
  data.push(basketTradingRow);
};

createBasket(".FTSE", "Steve FTSE 1");
createBasket(".FTSE", "Steve FTSE 2");
createBasket(".FTSE", "Steve FTSE 3");
createBasket(".FTSE", "Steve FTSE 4");
createBasket(".FTSE", "Steve FTSE 5");
createBasket(".FTSE", "Steve FTSE 6");

export default data;
