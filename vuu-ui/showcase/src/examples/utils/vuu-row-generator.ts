import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { RowAtIndexFunc } from "./ArrayProxy";

export const VuuRowGenerator =
  (columnCount: number): RowAtIndexFunc<VuuRowDataItemType[]> =>
  (index) =>
    [`row ${index + 1}`].concat(
      Array(columnCount)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`)
    );
