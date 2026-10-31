// Words that keep their capitalisation wherever they appear in a label
const PROPER_NOUNS = new Set(["Vuu", "Salt", "React"]);

// Lower case words that are displayed as acronyms
const ACRONYMS = new Set(["api", "css", "html", "json", "mdx", "ui", "url"]);

const UPPER_CASE = /^[A-Z0-9]+$/;

/**
 * Splits an identifier into words, at camelCase and acronym boundaries
 * e.g "GridLayoutFromJSON" => ["Grid", "Layout", "From", "JSON"]
 */
export const splitWords = (name: string) =>
  name
    .replace(/[-_.\s]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d+)/g, "$1 $2")
    .trim()
    .split(" ")
    .filter((word) => word !== "");

const formatWord = (word: string, isFirst: boolean) => {
  const lowerCase = word.toLowerCase();
  if (ACRONYMS.has(lowerCase)) {
    return lowerCase.toUpperCase();
  } else if (PROPER_NOUNS.has(word) || (UPPER_CASE.test(word) && word.length > 1)) {
    return word;
  } else if (isFirst) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  } else if (word.length === 1) {
    return word;
  } else {
    return lowerCase;
  }
};

/**
 * Converts an example, folder or document name to a human readable label,
 * in sentence case. A numeric ordering prefix ("1." or "01-") is removed.
 * Names that are entirely upper case (e.g. a table module, "SIMUL") are
 * left unchanged.
 */
export const humanise = (name: string) => {
  const unprefixed = name.replace(/^\d+[-.]/, "");
  if (UPPER_CASE.test(unprefixed)) {
    return unprefixed;
  }
  return splitWords(unprefixed)
    .map((word, i) => formatWord(word, i === 0))
    .join(" ");
};
