import {
  filterValue,
  isMultiClauseFilter,
  isMultiValueFilter,
  quotedStrings,
} from "@finos/vuu-utils";
import { Filter } from "@finos/vuu-filter-types";
import { ReactNode } from "react";

export const filterAsReactNode = (f: Filter): ReactNode => {
  if (isMultiClauseFilter(f)) {
    return (
      <div>
        <span>Match all ...</span>
        {f.filters.map((f, i) => (
          <div key={i}>{filterAsReactNode(f)}</div>
        ))}
      </div>
    );
  } else if (isMultiValueFilter(f)) {
    if (f.values.length > 3) {
      return `${f.column} ${f.op} [${f.values
        .slice(0, 3)
        .map(quotedStrings)
        .join(",")} ...]`;
    } else {
      return `${f.column} ${f.op} [${f.values.map(quotedStrings).join(",")}]`;
    }
  } else {
    return `${f.column} ${f.op} ${filterValue(f.value)}`;
  }
};
