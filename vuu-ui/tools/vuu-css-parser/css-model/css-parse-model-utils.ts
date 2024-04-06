import { SaltMatcher } from "../css-salt-matcher.ts";

export const isSelectorList = (cssTreeNode) =>
  cssTreeNode.type === "SelectorList";

export const isCustomProperty = (cssTreeNode) =>
  cssTreeNode.type === "Declaration" && cssTreeNode.property.startsWith("--");

export const isRGB = (cssTreeNode) =>
  cssTreeNode.type === "Function" &&
  (cssTreeNode.name === "rgb" || cssTreeNode.name === "rgba");

export const isVar = (cssTreeNode) =>
  cssTreeNode.type === "Function" && cssTreeNode.name === "var";

export const getVariableGroups = (variableName) => {
  if (typeof variableName !== "string") {
    throw Error("SaltClassifier requires a variable name");
  }
  if (!variableName.startsWith("--")) {
    throw Error(
      `getVariableGroups '${variableName}' is not a valid CSS Custom Property identifier`
    );
  }

  const sections = variableName.slice(2).split("-");
  const [root, sector] = sections;
  if (root === SaltMatcher.root) {
    return SaltMatcher.classifier(variableName);
  }

  return [root];
};
