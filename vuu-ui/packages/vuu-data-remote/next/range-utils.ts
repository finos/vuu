import { VuuRange } from "@vuu-ui/vuu-protocol-types";

export const rangeDiff = (
  oldRange: VuuRange | undefined,
  newRange: VuuRange,
): VuuRange => {
  let { from, to } = newRange;

  if (oldRange === undefined) {
    return { from, to };
  }

  if (newRange.from > oldRange.from && newRange.from < oldRange.to) {
    from = oldRange.to;
    to = newRange.to;
  }

  if (
    newRange.from < oldRange.from &&
    newRange.to < oldRange.to &&
    newRange.to > oldRange.from
  ) {
    from = newRange.from;
    to = oldRange.from;
  }

  return { from, to };
};
