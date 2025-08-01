import {
  VuuLink,
  VuuMenu,
  VuuRowDataItemType,
  VuuRpcViewportAction,
  VuuRpcViewportResponse,
} from "@vuu-ui/vuu-protocol-types";
import { ColumnMap, isViewportRpcRequest } from "@vuu-ui/vuu-utils";
import pricesTable from "./reference-data/prices";
import { joinTables, Table } from "../Table";
import { BasketsTableName, schemas } from "./basket-schemas";
import basketConstituentData from "./reference-data/constituents";
import {
  RpcService,
  ServiceHandler,
  VuuModule,
} from "../core/module/VuuModule";

const undefinedTables = {
  algoType: undefined,
  basket: undefined,
  basketTrading: undefined,
  basketTradingConstituent: undefined,
  basketConstituent: undefined,
  basketTradingConstituentJoin: undefined,
  priceStrategyType: undefined,
};

// This is a 'local' columnMap
const buildDataColumnMap = (tableName: BasketsTableName) =>
  Object.values(schemas[tableName].columns).reduce<ColumnMap>(
    (map, col, index) => {
      map[col.name] = index;
      return map;
    },
    {},
  );

const tableMaps: Record<BasketsTableName, ColumnMap> = {
  algoType: buildDataColumnMap("algoType"),
  basket: buildDataColumnMap("basket"),
  basketTrading: buildDataColumnMap("basketTrading"),
  basketTradingConstituent: buildDataColumnMap("basketTradingConstituent"),
  basketConstituent: buildDataColumnMap("basketConstituent"),
  basketTradingConstituentJoin: buildDataColumnMap(
    "basketTradingConstituentJoin",
  ),
  priceStrategyType: buildDataColumnMap("priceStrategyType"),
};

/**
 * BasketConstituent
 */

const basketConstituent = new Table(
  schemas.basketConstituent,
  basketConstituentData,
  tableMaps.basketConstituent,
);

/**
 * BasketTrading
 */
const basketTrading = new Table(
  schemas.basketTrading,
  [],
  tableMaps.basketTrading,
);

let basketIncrement = 1;
/**
 * BasketTradingConstituent
 */
const basketTradingConstituent = new Table(
  schemas.basketTradingConstituent,
  [],
  tableMaps.basketTradingConstituent,
);

// export as convenience for showcase examples
export const createBasketTradingRow = (
  basketId: string,
  basketName: string,
  side = "BUY",
  status = "OFF MARKET",
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
    (c) => c[key] === basketId,
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

const addConstituent: ServiceHandler = async (rpcRequest) => {
  if (isViewportRpcRequest(rpcRequest)) {
    throw Error(`addConstituent not implemented`);
  } else {
    throw Error(`addConstituent invalid rpcRequest`);
  }
};

const viewportRpcResponse = (
  params: string[],
  vpId: string,
  action?: Partial<VuuRpcViewportAction>,
): VuuRpcViewportResponse => ({
  type: "VIEW_PORT_RPC_RESPONSE",
  action: {
    type: "VP_RPC_SUCCESS",
    ...action,
  },
  method: "???",
  namedParams: {},
  params,
  vpId,
});

const sendToMarket: ServiceHandler = async (rpcRequest) => {
  if (isViewportRpcRequest(rpcRequest)) {
    const { vpId } = rpcRequest;
    const params = rpcRequest.params as string[];
    const [basketInstanceId] = params;
    basketTrading.update(basketInstanceId, "status", "ON_MARKET");
    return viewportRpcResponse(params, vpId);
  } else {
    throw Error(`sendToMarket invalid rpcRequest`);
  }
};
const takeOffMarket: ServiceHandler = async (rpcRequest) => {
  if (isViewportRpcRequest(rpcRequest)) {
    const { vpId } = rpcRequest;
    const params = rpcRequest.params as string[];
    const [basketInstanceId] = params;
    basketTrading.update(basketInstanceId, "status", "OFF-MARKET");
    return viewportRpcResponse(params, vpId);
  } else {
    throw Error(`takeOffMarket invalid rpcRequest`);
  }
};

const createNewBasket: ServiceHandler = async (rpcRequest) => {
  if (isViewportRpcRequest(rpcRequest)) {
    const { vpId } = rpcRequest;
    const params = rpcRequest.params as string[];
    const [basketId, basketName] = params;
    const key = createTradingBasket(basketId, basketName);
    return viewportRpcResponse(params, vpId, { key });
  } else {
    throw Error(`createNewBasket invalid rpcRequest`);
  }
};

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
    tableMaps.algoType,
  ),
  basket: new Table(
    schemas.basket,
    [
      [".NASDAQ100", ".NASDAQ100", 0, 0],
      [".HSI", ".HSI", 0, 0],
      [".FTSE100", ".FTSE100", 0, 0],
      [".SP500", ".SP500", 0, 0],
    ],
    tableMaps.basket,
  ),
  basketConstituent,
  basketTrading,
  basketTradingConstituent,
  basketTradingConstituentJoin: joinTables(
    { module: "BASKET", table: "basketTradingConstituentJoin" },
    basketTradingConstituent,
    pricesTable,
    "ric",
  ),
  priceStrategyType: new Table(
    schemas.priceStrategyType,
    [
      ["Peg to Near Touch", 0],
      ["Far Touch", 1],
      ["Limit", 2],
      ["Algo", 3],
    ],
    tableMaps.priceStrategyType,
  ),
};

const vuuLinks: Record<BasketsTableName, VuuLink[] | undefined> = {
  ...undefinedTables,
  basketConstituent: [
    { fromColumn: "basketId", toColumn: "id", toTable: "basket" },
  ],
};

const menus: Record<BasketsTableName, VuuMenu | undefined> = {
  ...undefinedTables,
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
};

const services: Record<BasketsTableName, RpcService[] | undefined> = {
  ...undefinedTables,
  basket: [
    {
      rpcName: "createBasket",
      service: createNewBasket,
    },
  ],
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
  basketTradingConstituentJoin: [
    {
      rpcName: "addConstituent",
      service: addConstituent,
    },
  ],
};

export const basketModule = new VuuModule<BasketsTableName>({
  menus,
  name: "BASKET",
  schemas,
  services,
  tables,
  vuuLinks,
});
