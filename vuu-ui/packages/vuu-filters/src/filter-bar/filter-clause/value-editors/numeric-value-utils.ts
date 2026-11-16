/**
 * Parses the whole of the text as a number, unlike parseFloat which
 * accepts trailing junk e.g. '12abc'. Returns undefined if text is not
 * a valid number, or not an integer when an integer is required.
 */
export const parseNumericValue = (
  text: string,
  integerOnly: boolean,
): number | undefined => {
  const trimmedText = text.trim();
  if (trimmedText === "") {
    return undefined;
  }
  const value = Number(trimmedText);
  if (!Number.isFinite(value) || (integerOnly && !Number.isInteger(value))) {
    return undefined;
  }
  return value;
};
