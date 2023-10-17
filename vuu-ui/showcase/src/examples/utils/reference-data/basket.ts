export type ID = string;
export type name = string;
export type notionalValue = number;
export type notionalValueUsd = number;

export type BasketDataRow = [ID, name, notionalValue, notionalValueUsd];

export const BasketColumnMap = {
  ID: 0,
  name: 1,
  notionalValue: 2,
  notionalValueUsd: 3,
};

const basket: BasketDataRow[] = [
  [".NASDAQ100", ".NASDAQ100", 0, 0],
  [".HSI", ".HSI", 0, 0],
  [".FTSE100", ".FTSE100", 0, 0],
  [".SP500", ".SP500", 0, 0],
];

export default basket;
