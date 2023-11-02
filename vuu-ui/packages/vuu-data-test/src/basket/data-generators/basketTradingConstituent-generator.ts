import {
  BasketTradingConstituentColumnMap,
  BasketTradingConstituentReferenceData,
} from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [rowGenerator] = getGenerators(
  "basketTradingConstituent",
  BasketTradingConstituentColumnMap,
  BasketTradingConstituentReferenceData
);

export default rowGenerator;
