import { SaltMatcher } from "./css-salt-matcher.mjs";

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

const tagCodes = {};
let nextTagCode = 0;

const tags = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const getTagCodes = () => tagCodes;

export const getTagCode = (tag) => {
  if (tagCodes[tag]) {
    return tagCodes[tag];
  } else {
    tagCodes[tag] = tags[nextTagCode++];
    return tagCodes[tag];
  }
};
