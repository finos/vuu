import { AggType } from "@vuu-ui/vuu-protocol-types";

// Note: flipped because of VUU
export const AggregationType: { [key: string]: AggType } = {
  Average: 2,
  Count: 3,
  Sum: 1,
  High: 4,
  Low: 5,
};

export const SortType = {
  ASC: "A",
  DSC: "D",
};
