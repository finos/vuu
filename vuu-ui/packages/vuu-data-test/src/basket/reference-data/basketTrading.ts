import { VuuDataRow } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { getSchema } from "../../schemas";

const schema = getSchema("basketTrading");

export const BasketTradingColumnMap = Object.values(
  schema.columns
).reduce<ColumnMap>((map, col, index) => {
  map[col.name] = index;
  return map;
}, {});

const data: VuuDataRow[] = [];

export default data;
