import { BasketColumnMap, BasketReferenceData } from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [rowGenerator] = getGenerators(
  "basket",
  BasketColumnMap,
  BasketReferenceData
);

export default rowGenerator;
