import { VuuModule } from "../vuu-modules";
import { ColumnMap, metadataKeys } from "@finos/vuu-utils";
import { BasketsTableName } from "./basket-schemas";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { schemas } from "./basket-schemas";
import ftse from "./reference-data/ftse100";
import nasdaq from "./reference-data/nasdaq100";
import sp500 from "./reference-data/sp500";
import hsi from "./reference-data/hsi";
import {
  ClientToServerViewportRpcCall,
  VuuMenu,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { Table } from "../Table";

// This is a 'local' columnMap
const buildDataColumnMap = (tableName: BasketsTableName) =>
  Object.values(schemas[tableName].columns).reduce<ColumnMap>(
    (map, col, index) => {
      map[col.name] = index;
      return map;
    },
    {}
  );

const tableMaps: Record<BasketsTableName, ColumnMap> = {
  algoType: buildDataColumnMap("algoType"),
  basket: buildDataColumnMap("basket"),
  basketTrading: buildDataColumnMap("basketTrading"),
  basketTradingConstituent: buildDataColumnMap("basketTradingConstituent"),
  basketConstituent: buildDataColumnMap("basketConstituent"),
  basketTradingConstituentJoin: buildDataColumnMap(
    "basketTradingConstituentJoin"
  ),
  priceStrategyType: buildDataColumnMap("priceStrategyType"),
};

//---------------

const { KEY } = metadataKeys;

/**
 * BasketConstituent
 */

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

const basketConstituent = new Table(
  schemas.basketConstituent,
  basketConstituentData,
  tableMaps.basketConstituent
);

/**
 * BasketTrading
 */
const basketTrading = new Table(
  schemas.basketTrading,
  [],
  tableMaps.basketTrading
);

let basketIncrement = 1;
/**
 * BasketTradingConstituent
 */
const basketTradingConstituent = new Table(
  schemas.basketTradingConstituent,
  [],
  tableMaps.basketTradingConstituent
);
const basketTradingConstituentJoin = new Table(
  schemas.basketTradingConstituentJoin,
  [],
  tableMaps.basketTradingConstituentJoin
);

// export as convenience for showcase examples
export const createBasketTradingRow = (
  basketId: string,
  basketName: string,
  side = "BUY",
  status = "OFF MARKET"
) => [
  basketId,
  basketName,
  0,
  1.25,
  `steve-${basketIncrement++}`,
  side,
  status,
  1_000_000,
  1_250_000,
  100,
];

function createTradingBasket(basketId: string, basketName: string) {
  const basketTradingRow = createBasketTradingRow(basketId, basketName);

  basketTrading.insert(basketTradingRow);

  const { basketId: key } = buildDataColumnMap("basketConstituent");
  const constituents = basketConstituent.data.filter(
    (c) => c[key] === basketId
  );

  constituents.forEach(([, , description, , ric, , , quantity, weighting]) => {
    const algo = "";
    const algoParams = "";
    const limitPrice = 95;
    const notionalLocal = 0;
    const notionalUsd = 0;
    const pctFilled = 0;
    const priceSpread = 0;
    const priceStrategyId = "";
    const side = "BUY";
    const venue = "venue";

    const { instanceId } = tableMaps.basketTrading;
    const basketInstanceId = basketTradingRow[instanceId];
    const basketTradingConstituentRow: VuuRowDataItemType[] = [
      algo,
      algoParams,
      basketId,
      description,
      basketInstanceId,
      `${basketInstanceId}-${ric}`,
      limitPrice,
      notionalLocal,
      notionalUsd,
      pctFilled,
      priceSpread,
      priceStrategyId,
      quantity,
      ric,
      side,
      venue,
      weighting,
    ];
    basketTradingConstituent.insert(basketTradingConstituentRow);

    const ask = 0;
    const askSize = 0;
    const bid = 0;
    const bidSize = 0;
    const close = 0;
    const last = 0;
    const open = 0;
    const phase = "market";
    const scenario = "scenario";
    const status = "on market";

    const basketTradingConstituentJoinRow = [
      algo,
      algoParams,
      ask,
      askSize,
      basketId,
      bid,
      bidSize,
      close,
      description,
      basketInstanceId,
      `${basketInstanceId}-${ric}`,
      last,
      limitPrice,
      notionalLocal,
      notionalUsd,
      open,
      pctFilled,
      phase,
      priceSpread,
      priceStrategyId,
      quantity,
      ric,
      scenario,
      side,
      status,
      venue,
      weighting,
    ];
    basketTradingConstituentJoin.insert(basketTradingConstituentJoinRow);
  });
}

async function createNewBasket(rpcRequest: ClientToServerViewportRpcCall) {
  const {
    params: [basketId, basketName],
  } = rpcRequest;
  createTradingBasket(basketId, basketName);
}

//-------------------

export const tables: Record<BasketsTableName, Table> = {
  algoType: new Table(
    schemas.algoType,
    [
      ["Sniper", 0],
      ["Dark Liquidity", 1],
      ["VWAP", 2],
      ["POV", 3],
      ["Dynamic Close", 4],
    ],
    tableMaps.algoType
  ),
  basket: new Table(
    schemas.basket,
    [
      [".NASDAQ100", ".NASDAQ100", 0, 0],
      [".HSI", ".HSI", 0, 0],
      [".FTSE100", ".FTSE100", 0, 0],
      [".SP500", ".SP500", 0, 0],
    ],
    tableMaps.basket
  ),
  basketConstituent,
  basketTrading,
  basketTradingConstituent,
  basketTradingConstituentJoin,
  priceStrategyType: new Table(
    schemas.priceStrategyType,
    [
      ["Peg to Near Touch", 0],
      ["Far Touch", 1],
      ["Limit", 2],
      ["Algo", 3],
    ],
    tableMaps.priceStrategyType
  ),
};

const menus: Record<BasketsTableName, VuuMenu | undefined> = {
  algoType: undefined,
  basket: {
    name: "ROOT",
    menus: [
      {
        context: "selected-rows",
        filter: "",
        name: "Add Basket",
        rpcName: "CREATE_NEW_BASKET",
      },
    ],
  },
  basketConstituent: undefined,
  basketTrading: undefined,
  basketTradingConstituent: undefined,
  basketTradingConstituentJoin: undefined,
  priceStrategyType: undefined,
};

type RpcService = {
  rpcName: string;
  service: (rpcRequest: any) => Promise<unknown>;
};

const services: Record<BasketsTableName, RpcService[] | undefined> = {
  algoType: undefined,
  basket: [
    {
      rpcName: "createBasket",
      service: createNewBasket,
    },
  ],
  basketConstituent: undefined,
  basketTrading: undefined,
  basketTradingConstituent: undefined,
  basketTradingConstituentJoin: undefined,
  priceStrategyType: undefined,
};

const getColumnDescriptors = (tableName: BasketsTableName) => {
  const schema = schemas[tableName];
  return schema.columns;
};

const createDataSource = (tableName: BasketsTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  const { key } = schemas[tableName];
  return new TickingArrayDataSource({
    columnDescriptors,
    dataMap: tableMaps[tableName],
    keyColumn: key,
    menu: menus[tableName],
    rpcServices: services[tableName],
    table: tables[tableName],
    // updateGenerator: createUpdateGenerator?.(),
  });
};

const basketModule: VuuModule<BasketsTableName> = {
  createDataSource,
};

export default basketModule;
