import { RowGeneratorFactory } from "../..";
import { BasketsTableName } from "../basket-schemas";
import basketGenerators from "./basket-generator";
import basketConstituentGenerators from "./basketConstituent-generator";
import basketTradingGenerators from "./basketTrading-generator";
import basketTradingConstituentGenerators from "./basketTradingConstituent-generator";

const generators: Record<BasketsTableName, RowGeneratorFactory | undefined> = {
  algoType: undefined,
  basket: basketGenerators,
  basketConstituent: basketConstituentGenerators,
  basketTrading: basketTradingGenerators,
  basketTradingConstituent: basketTradingConstituentGenerators,
  basketTradingConstituentJoin: basketTradingConstituentGenerators,
  priceStrategyType: undefined,
};

export default generators;
