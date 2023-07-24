import { VuuAggType } from "@finos/vuu-protocol-types";

// Note: flipped because of VUU
export const AggregationType: { [key: string]: VuuAggType } = {
  Average: 2,
  Count: 3,
  Sum: 1,
  High: 4,
  Low: 5,
  Distinct: 6,
};

export const SortType = {
  ASC: "A",
  DSC: "D",
};
