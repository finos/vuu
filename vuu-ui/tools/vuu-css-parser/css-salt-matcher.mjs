export const SaltMatcher = {
  root: "salt",
  classifier: SaltClassifier,
};

const foundations = new Set([
  "animation",
  "color",
  "delay",
  "opacity",
  "shadow",
  "size",
  "typography",
  "zIndex",
]);

function SaltClassifier(variableName) {
  const [root, classifier, ...rest] = variableName.slice(2).split("-");
  const isFoundation = foundations.has(classifier);
  const isPalette = classifier === "palette";

  if (root === "salt") {
    const result = ["salt"];
    if (isFoundation) {
      result.push("foundation");
    } else if (isPalette) {
      result.push("palette");
    } else {
      result.push("characteristic");
    }
    return result;
  } else {
    return undefined;
  }
}
