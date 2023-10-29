import {
  BasketTradingConstituentColumnMap,
  BasketTradingConstituentReferenceData,
} from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [RowGenerator, ColumnGenerator] = getGenerators(
  "basketTradingConstituent",
  BasketTradingConstituentColumnMap,
  BasketTradingConstituentReferenceData
);

export { RowGenerator, ColumnGenerator };
