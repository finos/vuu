import {
  ClientToServerViewportRpcCall,
  VuuMenu,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import pricesTable from "./reference-data/prices";
import { joinTables, Table } from "../Table";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import type { RpcService, VuuModule } from "../vuu-modules";
import { BasketsTableName, schemas } from "./basket-schemas";
import basketConstituentData from "./reference-data/constituents";

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

/**
 * BasketConstituent
 */

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

  const { instanceId } = tableMaps.basketTrading;

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
  });

  // return the key
  return basketTradingRow[instanceId] as string;
}

async function addConstituent(rpcRequest: ClientToServerViewportRpcCall) {
  console.log(`RPC call erceived ${rpcRequest.rpcName}`);
}
async function sendToMarket(rpcRequest: ClientToServerViewportRpcCall) {
  const [basketInstanceId] = rpcRequest.params;
  basketTrading.update(basketInstanceId, "status", "ON_MARKET");
}
async function takeOffMarket(rpcRequest: ClientToServerViewportRpcCall) {
  const [basketInstanceId] = rpcRequest.params;
  basketTrading.update(basketInstanceId, "status", "OFF-MARKET");
}

async function createNewBasket(rpcRequest: ClientToServerViewportRpcCall) {
  const {
    params: [basketId, basketName],
  } = rpcRequest;
  const key = createTradingBasket(basketId, basketName);
  return {
    action: {
      type: "VP_CREATE_SUCCESS",
      key,
    },
  };
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
  basketTradingConstituentJoin: joinTables(
    { module: "BASKET", table: "basketTradingConstituentJoin" },
    basketTradingConstituent,
    pricesTable,
    "ric"
  ),
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

const services: Record<BasketsTableName, RpcService[] | undefined> = {
  algoType: undefined,
  basket: [
    {
      rpcName: "createBasket",
      service: createNewBasket,
    },
  ],
  basketConstituent: undefined,
  basketTrading: [
    {
      rpcName: "sendToMarket",
      service: sendToMarket,
    },
    {
      rpcName: "takeOffMarket",
      service: takeOffMarket,
    },
  ],
  basketTradingConstituent: undefined,
  basketTradingConstituentJoin: [
    {
      rpcName: "addConstituent",
      service: addConstituent,
    },
  ],
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

const nullTypeaheadHook = async () => [];

const basketModule: VuuModule<BasketsTableName> = {
  createDataSource,
  typeaheadHook: () => nullTypeaheadHook,
};

export default basketModule;
