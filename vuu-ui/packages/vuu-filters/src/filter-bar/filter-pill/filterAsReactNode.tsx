import { isMultiClauseFilter, isMultiValueFilter } from "@vuu-ui/vuu-utils";
import { Filter } from "@vuu-ui/vuu-filter-types";
import { ReactNode } from "react";
import { getFilterLabel } from "./getFilterLabel";

export const filterAsReactNode = (
  f: Filter,
  getLabel: (f: Filter) => string = getFilterLabel(),
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
  } else if (isMultiValueFilter(f)) {
    if (f.values.length > 3) {
      const values = f.values.slice(0, 3);
      return `${getLabel({ ...f, values }).slice(0, -1)},...]`;
    } else {
      return getLabel(f);
    }
  } else {
    return getLabel(f);
  }
};
