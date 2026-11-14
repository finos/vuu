/**
 * Options for a combobox that may be re-entered with a value already
 * selected. Options are filtered only by text the user has typed, so all
 * options are listed when the field is re-entered. The current value is
 * listed first. The combobox highlights the first option when it opens, so
 * Enter or Tab then keeps the value unchanged.
 */
export const getOptionList = <T>(
  items: readonly T[],
  getText: (item: T) => string,
  typedText: string,
  currentValue?: string,
): T[] => {
  const pattern = typedText.trim().toLowerCase();
  const matches =
    pattern === ""
      ? [...items]
      : items.filter((item) => getText(item).toLowerCase().includes(pattern));
  const current =
    pattern === "" && currentValue
      ? matches.find((item) => getText(item) === currentValue)
      : undefined;
  return current === undefined
    ? matches
    : [current, ...matches.filter((item) => item !== current)];
};
