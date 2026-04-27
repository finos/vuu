import { VuuMenu, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { ColumnMap } from "@vuu-ui/vuu-utils";
import {
  RpcMenuService,
  ServiceHandler,
  VuuModule,
} from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";
import { BasketsTableName, schemas } from "./basket-schemas";
import basketConstituentData from "./reference-data/constituents";
import { type Table } from "../Table";

const { createTable } = tableContainer;

let basketIncrement = 1;

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

const basketTradingConstituent = tableContainer.createTable(
  schemas.basketTradingConstituent,
  [],
  tableMaps.basketTradingConstituent,
);

/**
 * This is an example of how we might extend the built-in VuuModule to
 * implement a module-specific service in such a way that it can invoke
 * methods on the VuuModule.
 */
export class BasketModule extends VuuModule<BasketsTableName> {
  #tables: Record<BasketsTableName, Table> = {
    algoType: createTable(
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
    basket: createTable(
      schemas.basket,
      [
        [".NASDAQ100", ".NASDAQ100", 0, 0],
        [".HSI", ".HSI", 0, 0],
        [".FTSE100", ".FTSE100", 0, 0],
        [".SP500", ".SP500", 0, 0],
      ],
      tableMaps.basket,
    ),
    basketConstituent: createTable(
      schemas.basketConstituent,
      basketConstituentData,
      tableMaps.basketConstituent,
    ),
    basketTrading: createTable(
      schemas.basketTrading,
      [],
      tableMaps.basketTrading,
    ),
    basketTradingConstituent,
    basketTradingConstituentJoin: tableContainer.createJoinTable(
      { module: "BASKET", table: "basketTradingConstituentJoin" },
      { module: "BASKET", table: "basketTradingConstituent" },
      { module: "SIMUL", table: "prices" },
      "ric",
    ),
    priceStrategyType: createTable(
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

  constructor() {
    super("BASKET");
  }

  get menus(): Record<BasketsTableName, VuuMenu | undefined> {
    return {
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
  }

  get schemas() {
    return schemas;
  }

  get services() {
    return {
      ...undefinedTables,
      basket: [
        {
          rpcName: "createBasket",
          service: this.createNewBasket,
        },
      ],
      basketTrading: [
        {
          rpcName: "sendToMarket",
          service: this.sendToMarket,
        },
        {
          rpcName: "takeOffMarket",
          service: this.takeOffMarket,
        },
      ],
      basketTradingConstituentJoin: [
        {
          rpcName: "addConstituent",
          service: this.addConstituent,
        },
      ],
    };
  }

  get menuServices():
    | Record<BasketsTableName, RpcMenuService[] | undefined>
    | undefined {
    return {
      ...undefinedTables,
    };
  }

  get tables() {
    return this.#tables;
  }

  get visualLinks() {
    return {
      ...undefinedTables,
      basketConstituent: [
        { fromColumn: "basketId", toColumn: "id", toTable: "basket" },
      ],
    };
  }

  private createTradingBasket(basketId: string, basketName: string) {
    const basketTradingRow = createBasketTradingRow(basketId, basketName);

    this.tables.basketTrading.insert(basketTradingRow);

    const { basketId: key } = buildDataColumnMap("basketConstituent");
    const constituents = this.tables.basketConstituent.data.filter(
      (c) => c[key] === basketId,
    );

    const { instanceId } = tableMaps.basketTrading;

    constituents.forEach(
      ([, , description, , ric, , , quantity, weighting]) => {
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
      },
    );

    // return the key
    return basketTradingRow[instanceId] as string;
  }

  private createNewBasket: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { sourceBasketId, tradeBasketName } = rpcRequest.params;
      const key = this.createTradingBasket(
        sourceBasketId as string,
        tradeBasketName as string,
      );
      return {
        type: "SUCCESS_RESULT",
        data: key,
      };
    } else {
      throw Error("[BasketModule] createNewBasket invalid request type");
    }
  };

  private sendToMarket: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { basketInstanceId } = rpcRequest.params;
      this.tables.basketTrading.update(
        basketInstanceId as string,
        "status",
        "ON_MARKET",
      );
      return {
        type: "SUCCESS_RESULT",
        data: undefined,
      };
    } else {
      throw Error("[BasketModule] createNewBasket invalid request type");
    }
  };
  private takeOffMarket: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { basketInstanceId } = rpcRequest.params;
      this.tables.basketTrading.update(
        basketInstanceId as string,
        "status",
        "OFF-MARKET",
      );
      return {
        type: "SUCCESS_RESULT",
        data: undefined,
      };
    } else {
      throw Error("[BasketModule] createNewBasket invalid request type");
    }
  };

  private addConstituent: ServiceHandler = async () => {
    throw Error(`addConstituent not implemented`);
  };
}

export const basketModule = new BasketModule();
