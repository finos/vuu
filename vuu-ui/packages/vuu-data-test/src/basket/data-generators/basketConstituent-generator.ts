import {
  BasketConstituentColumnMap,
  BasketConstituentReferenceData,
} from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [RowGenerator, ColumnGenerator] = getGenerators(
  "basketConstituent",
  BasketConstituentColumnMap,
  BasketConstituentReferenceData
);

export { RowGenerator, ColumnGenerator };
