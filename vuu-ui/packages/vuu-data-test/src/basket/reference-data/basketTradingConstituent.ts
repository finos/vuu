import { VuuDataRow } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { getSchema } from "../../schemas";

const schema = getSchema("basketTradingConstituent");

export const BasketTradingConstituentColumnMap = Object.values(
  schema.columns
).reduce<ColumnMap>((map, col, index) => {
  map[col.name] = index;
  return map;
}, {});

const data: VuuDataRow[] = [];

export default data;
