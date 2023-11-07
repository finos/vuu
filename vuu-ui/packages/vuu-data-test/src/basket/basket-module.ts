import { VuuModule } from "../vuu-modules";
import { ColumnMap, metadataKeys } from "@finos/vuu-utils";
import { BasketsTableName } from "./basket-schemas";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { schemas } from "./basket-schemas";
import ftse from "./reference-data/ftse100";
import nasdaq from "./reference-data/nasdaq100";
import sp500 from "./reference-data/sp500";
import hsi from "./reference-data/hsi";
import { VuuMenu } from "@finos/vuu-protocol-types";
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

//---------------
// export const BasketColumnMap = buildColumnMap("basket");

const { KEY } = metadataKeys;

/**
 * Basket
 */
const basket = new Table(schemas.basket, [
  [".NASDAQ100", ".NASDAQ100", 0, 0],
  [".HSI", ".HSI", 0, 0],
  [".FTSE100", ".FTSE100", 0, 0],
  [".SP500", ".SP500", 0, 0],
]);

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
  basketConstituentData.push([ basketId, change, lastTrade, ric, `${ric}-${basketId}`, side, volume, weighting ]);
}

for (const row of hsi) {
  // prettier-ignore
  const [name, ric, lastTrade, change, , volume] = row;
  const basketId = ".HSI";
  const side = "BUY";
  const weighting = 1;
  // prettier-ignore
  basketConstituentData.push([basketId,change,lastTrade,ric,`${ric}-${basketId}`,side,volume,weighting ]);
}

for (const row of nasdaq) {
  // prettier-ignore
  const [, ric, weighting, lastTrade, change] = row;
  const basketId = ".NASDAQ100";
  const side = "BUY";
  const volume = 1000;
  // prettier-ignore
  basketConstituentData.push([ basketId, change, lastTrade, ric, `${ric}-${basketId}`, side, volume, weighting ]);
}

for (const row of sp500) {
  // prettier-ignore
  const [, ric, weighting,,change] = row;
  const basketId = ".SP500";
  const side = "BUY";
  const volume = 1000;
  const lastTrade = 0;
  // prettier-ignore
  basketConstituentData.push([ basketId, change, lastTrade, ric, `${ric}-${basketId}`, side, volume, weighting ]);
}

const basketConstituent = new Table(
  schemas.basketConstituent,
  basketConstituentData
);

/**
 * BasketTrading
 */
const basketTrading = new Table(schemas.basketTrading, []);

let basketIncrement = 1;
/**
 * BasketTradingConstituent
 */
const basketTradingConstituent = new Table(
  schemas.basketTradingConstituent,
  []
);
const basketTradingConstituentJoin = new Table(
  schemas.basketTradingConstituentJoin,
  []
);

function createTradingBasket(basketId: string, basketName: string) {
  const instanceId = `steve-${basketIncrement++}`;
  const basketTradingRow = [
    basketId,
    basketName,
    0,
    1.25,
    instanceId,
    "OFF MARKET",
    1_000_000,
    1_250_000,
    100,
  ];

  basketTrading.insert(basketTradingRow);

  const { basketId: key } = buildDataColumnMap("basketConstituent");
  const constituents = basketConstituent.data.filter(
    (c) => c[key] === basketId
  );
  constituents.forEach(([, , , ric, , , volume, weighting]) => {
    const row = [
      "algo1",
      "",
      basketId,
      100,
      "description",
      instanceId,
      `${instanceId}-${ric}`,
      95,
      0,
      0,
      0,
      0,
      volume,
      ric,
      "BUY",
      "LSE",
      weighting,
    ];
    basketTradingConstituent.insert(row);
  });
}

async function createNewBasket(rpcRequest: any) {
  const { basketName, selectedRows } = rpcRequest;
  if (selectedRows.length === 1) {
    const [row] = selectedRows;
    const basketId = row[KEY];
    createTradingBasket(basketId, basketName);
  }
}

//-------------------

const tables: Record<BasketsTableName, Table> = {
  algoType: new Table(schemas.algoType, []),
  basket,
  basketConstituent,
  basketTrading,
  basketTradingConstituent,
  basketTradingConstituentJoin,
  priceStrategyType: new Table(schemas.priceStrategyType, []),
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
      rpcName: "CREATE_NEW_BASKET",
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
  return new TickingArrayDataSource({
    columnDescriptors,
    table: tables[tableName],
    menu: menus[tableName],
    rpcServices: services[tableName],
    // updateGenerator: createUpdateGenerator?.(),
  });
};

const basketModule: VuuModule<BasketsTableName> = {
  createDataSource,
};

export default basketModule;
