import { VuuDataRow } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { getSchema } from "../../schemas";

const schema = getSchema("basket");

export const BasketColumnMap = Object.values(schema.columns).reduce<ColumnMap>(
  (map, col, index) => {
    map[col.name] = index;
    return map;
  },
  {}
);

const data: VuuDataRow[] = [
  [".NASDAQ100", ".NASDAQ100", 0, 0],
  [".HSI", ".HSI", 0, 0],
  [".FTSE100", ".FTSE100", 0, 0],
  [".SP500", ".SP500", 0, 0],
];

export default data;
