import { VuuDataRow } from "@finos/vuu-protocol-types";
import { getSchema } from "../../schemas";
import { ColumnMap } from "@finos/vuu-utils";
import ftse from "./ftse100";

const schema = getSchema("basketConstituent");

export const BasketConstituentColumnMap = Object.values(
  schema.columns
).reduce<ColumnMap>((map, col, index) => {
  map[col.name] = index;
  return map;
}, {});

const data: VuuDataRow[] = [];

// const start = performance.now();
// Create 100_000 Instruments

for (const row of ftse) {
  // prettier-ignore
  const [ric, name, lastTrade, change, volume] = row;

  const basketId = ".FTSE100";
  const side = "BUY";
  const weighting = 1;

  data.push([
    basketId,
    change,
    lastTrade,
    ric,
    `${ric}-${basketId}`,
    side,
    volume,
    weighting,
  ]);
}

// const end = performance.now();
// console.log(`generating 100,000 instrumentPrices took ${end - start} ms`);

export default data;
