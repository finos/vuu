import type { TreeSourceNode } from "@vuu-ui/vuu-utils";

export type TreeSearchResult = {
  id: string;
  matchType: "example" | "component" | "tag" | "doc";
  matchResult: string;
};

export const findInTree = (
  treeNodes: TreeSourceNode[],
  pattern: string,
  results: TreeSearchResult[] = [],
  regexp = new RegExp(`${pattern}`, "i"),
): TreeSearchResult[] => {
  for (const node of treeNodes) {
    const { id, childNodes, label } = node;
    if (regexp.test(label)) {
      console.log(`we have a match with ${pattern} on ${label} (#${id})`);
      results.push({
        id,
        matchResult: label,
        matchType: "example",
      });
      if (Array.isArray(childNodes)) {
        findInTree(childNodes, pattern, results, regexp);
      }
    }
  }

  return results;
};
