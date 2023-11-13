import {
  BasketTradingColumnMap,
  BasketTradingReferenceData,
} from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [rowGenerator] = getGenerators(
  "basketTrading",
  BasketTradingColumnMap,
  BasketTradingReferenceData
);

export default rowGenerator;
