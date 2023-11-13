import { RowGeneratorFactory } from "../..";
import { BasketsTableName } from "../basket-schemas";
import basketGenerators from "./basket-generator";
import basketConstituentGenerators from "./basketConstituent-generator";
import basketTradingGenerators from "./basketTrading-generator";
import basketTradingConstituentGenerators from "./basketTradingConstituent-generator";

const generators: Record<BasketsTableName, RowGeneratorFactory> = {
  basket: basketGenerators,
  basketConstituent: basketConstituentGenerators,
  basketTrading: basketTradingGenerators,
  basketTradingConstituent: basketTradingConstituentGenerators,
};

export default generators;
