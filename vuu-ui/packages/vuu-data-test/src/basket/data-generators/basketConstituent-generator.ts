import {
  BasketConstituentColumnMap,
  BasketConstituentReferenceData,
} from "../reference-data";
import { getGenerators } from "../../generatorTemplate";

const [rowGenerator] = getGenerators(
  "basketConstituent",
  BasketConstituentColumnMap,
  BasketConstituentReferenceData
);

export default rowGenerator;
