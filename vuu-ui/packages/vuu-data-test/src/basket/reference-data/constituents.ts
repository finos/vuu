import ftse from "./ftse100";
import nasdaq from "./nasdaq100";
import sp500 from "./sp500";
import hsi from "./hsi";
import { VuuRowDataItemType } from "packages/vuu-protocol-types";

const basketConstituentData = [];
for (const row of ftse) {
  // prettier-ignore
  const [ric, name, lastTrade, change, volume] = row;
  const basketId = ".FTSE100";
  const side = "BUY";
  const weighting = 1;
  // prettier-ignore
  basketConstituentData.push([ basketId, change, name, lastTrade, ric, `${ric}-${basketId}`, side, volume, weighting ]);
}

for (const row of hsi) {
  // prettier-ignore
  const [name, ric, lastTrade, change, , volume] = row;
  const basketId = ".HSI";
  const side = "BUY";
  const weighting = 1;
  // prettier-ignore
  basketConstituentData.push([basketId,change,name, lastTrade,ric,`${ric}-${basketId}`,side,volume,weighting ]);
}

for (const row of nasdaq) {
  // prettier-ignore
  const [name, ric, weighting, lastTrade, change] = row;
  const basketId = ".NASDAQ100";
  const side = "BUY";
  const volume = 1000;
  // prettier-ignore
  basketConstituentData.push([ basketId, change, name, lastTrade, ric, `${ric}-${basketId}`, side, volume, weighting ]);
}

for (const row of sp500) {
  // prettier-ignore
  const [name, ric, weighting,,change] = row;
  const basketId = ".SP500";
  const side = "BUY";
  const volume = 1000;
  const lastTrade = 0;
  // prettier-ignore
  basketConstituentData.push([ basketId, change, name, lastTrade, ric, `${ric}-${basketId}`, side, volume, weighting ]);
}

export default basketConstituentData as VuuRowDataItemType[][];
