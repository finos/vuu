import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import constituents from "./constituents.json";
import { schemas } from "../basket-schemas";

const basketConstituentData: VuuRowDataItemType[][] = constituents.map(
  (constituent) => {
    const values: Record<string, VuuRowDataItemType> = constituent;
    return schemas.basketConstituent.columns.map(({ name }) => values[name]);
  },
);

export default basketConstituentData;
