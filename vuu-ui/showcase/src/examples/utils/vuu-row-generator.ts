import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { RowAtIndexFunc } from "./ArrayProxy";

export const VuuColumnGenerator = (columnCount: number): string[] =>
  ["Row No"].concat(
    Array(columnCount)
      .fill("")
      .map((_, i) => `Column ${i + 1}`)
  );

export const VuuRowGenerator =
  (columnCount: number): RowAtIndexFunc<VuuRowDataItemType[]> =>
  (index) =>
    [index, `row ${index + 1}`].concat(
      Array(columnCount)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`)
    );
