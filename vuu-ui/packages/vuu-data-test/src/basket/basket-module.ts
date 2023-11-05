import { VuuModule } from "../vuu-modules";
import { metadataKeys } from "@finos/vuu-utils";
import { BasketsTableName } from "./basket-schemas";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { schemas } from "./basket-schemas";
import ftse from "./reference-data/ftse100";
// import { ColumnMap } from "@finos/vuu-utils";
import {
  VuuDataRow,
  VuuMenu,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";

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
const basket: VuuDataRow[] = [
  [".NASDAQ100", ".NASDAQ100", 0, 0],
  [".HSI", ".HSI", 0, 0],
  [".FTSE100", ".FTSE100", 0, 0],
  [".SP500", ".SP500", 0, 0],
];

/**
 * BasketConstituent
 */
const basketConstituent: VuuDataRow[] = [];

for (const row of ftse) {
  // prettier-ignore
  const [ric, name, lastTrade, change, volume] = row;

  const basketId = ".FTSE100";
  const side = "BUY";
  const weighting = 1;

  basketConstituent.push([
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

/**
 * BasketTrading
 */
const basketTrading: VuuDataRow[] = [];

let basketIncrement = 1;
/**
 * BasketTradingConstituent
 */
const basketTradingConstituent: VuuDataRow[] = [];

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
  basketTrading.push(basketTradingRow);

  const { basketId: key } = buildDataColumnMap("basketConstituent");
  const constituents = basketConstituent.filter((c) => c[key] === basketId);
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
    basketTradingConstituent.push(row);
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

const tables: Record<BasketsTableName, VuuDataRow[]> = {
  basket,
  basketConstituent,
  basketTrading,
  basketTradingConstituent,
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
  basketTrdConsPrices: undefined,
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
  basketTrdConsPrices: undefined,
  priceStrategyType: undefined,
};

export const populateArray = (tableName: BasketsTableName, count: number) => {
  const table = tables[tableName];
  const data: Array<VuuRowDataItemType[]> = [];
  for (let i = 0; i < count; i++) {
    if (i >= table.length) {
      break;
    }
    data[i] = table[i].slice(0, 7);
  }
  return data;
};

const getColumnDescriptors = (tableName: BasketsTableName) => {
  const schema = schemas[tableName];
  return schema.columns;
};

const createDataSource = (tableName: BasketsTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  const dataArray = populateArray(tableName, 100);
  return new TickingArrayDataSource({
    columnDescriptors,
    data: dataArray,
    menu: menus[tableName],
    rpcServices: services[tableName],
    // updateGenerator: createUpdateGenerator?.(),
  });
};

const basketModule: VuuModule<BasketsTableName> = {
  createDataSource,
};

export default basketModule;
