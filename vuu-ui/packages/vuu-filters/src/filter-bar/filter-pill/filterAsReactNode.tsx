import { isMultiClauseFilter, isMultiValueFilter } from "@vuu-ui/vuu-utils";
import { Filter } from "@vuu-ui/vuu-filter-types";
import { ReactNode } from "react";
import { getFilterLabel } from "./getFilterLabel";

const MAX_VALUES = 3;

/**
 * Renders a filter, multi clause filters as a list of clauses. A multi value
 * clause shows at most three values. getLabel renders one clause, told when
 * values were left out; when it returns a string, the list of values is
 * closed with ",...]" after the third value.
 */
export const filterAsReactNode = (
  f: Filter,
  getLabel: (f: Filter, truncated?: boolean) => ReactNode = getFilterLabel(),
): ReactNode => {
  if (isMultiClauseFilter(f)) {
    const heading = f.op === "and" ? "Match all ..." : "Match any ...";
    return (
      <ul>
        <span>{heading}</span>
        {f.filters.map((f, i) => (
          <li key={i}>{filterAsReactNode(f, getLabel)}</li>
        ))}
      </ul>
    );
  } else if (isMultiValueFilter(f) && f.values.length > MAX_VALUES) {
    const values = f.values.slice(0, MAX_VALUES);
    const label = getLabel({ ...f, values }, true);
    return typeof label === "string" ? `${label.slice(0, -1)},...]` : label;
  } else {
    return getLabel(f);
  }
};
