import { BasketColumnMap, BasketReferenceData } from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [RowGenerator, ColumnGenerator] = getGenerators(
  "basket",
  BasketColumnMap,
  BasketReferenceData
);

export { RowGenerator, ColumnGenerator };
