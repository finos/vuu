import { TableCellTemplate } from "./TableCellTemplate";

export const ScaledDecimalTwoDecimals = () => {
  return (
    <TableCellTemplate
      column={{ name: "price", serverDataType: "scaleddecimal8" }}
      value="100.00000000"
    />
  );
};

export const ScaledDecimalLargeNumberTwoDecimals = () => {
  return (
    <TableCellTemplate
      column={{ name: "price", serverDataType: "scaleddecimal8", width: 200 }}
      value="10000000000000123.00000000"
    />
  );
};
