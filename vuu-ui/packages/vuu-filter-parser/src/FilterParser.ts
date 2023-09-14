import { Filter } from "@finos/vuu-filter-types";
import { parser } from "./generated/filter-parser";
import { walkTree } from "./FilterTreeWalker";

const strictParser = parser.configure({ strict: true });

export const parseFilter = (filterQuery: string): Filter => {
  const parseTree = strictParser.parse(filterQuery);
  const filter = walkTree(parseTree, filterQuery) as Filter;
  return filter;
};
