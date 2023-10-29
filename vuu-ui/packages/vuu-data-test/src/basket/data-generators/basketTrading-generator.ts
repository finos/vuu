import {
  BasketTradingColumnMap,
  BasketTradingReferenceData,
} from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [RowGenerator, ColumnGenerator] = getGenerators(
  "basketTrading",
  BasketTradingColumnMap,
  BasketTradingReferenceData
);

export { RowGenerator, ColumnGenerator };
