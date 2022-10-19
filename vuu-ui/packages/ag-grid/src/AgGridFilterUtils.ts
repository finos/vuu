import { filterAsQuery } from "@vuu-ui/datagrid-parsers";
import { Filter, MultiClauseFilter } from "@vuu-ui/utils";
import {
  AndFilter,
  FilterClause,
  SingleValueFilterClauseOp,
} from "@vuu-ui/utils";

export type AgGridSetFilter = {
  filterType: "set";
  values: string[];
};
export type AgGridGreaterThanFilter = {
  filter: number;
  filterType: "number";
  type: "greaterThan";
};
export type AgGridGreaterThanOrEqualFilter = {
  filter: number;
  filterType: "number";
  type: "greaterThanOrEqual";
};
export type AgGridLessThanFilter = {
  filter: number;
  filterType: "number";
  type: "lessThan";
};
export type AgGridLessThanOrEqualFilter = {
  filter: number;
  filterType: "number";
  type: "lessThanOrEqual";
};

export type AgGridEqualsFilter = {
  filter: string | number;
  filterType: "number" | "text";
  type: "equals";
};
export type AgGridNotEqualFilter = {
  filter: string | number;
  filterType: "number" | "text";
  type: "notEqual";
};
export type AgGridStartsWithFilter = {
  filter: string;
  filterType: "text";
  type: "startsWith";
};

export type AgGridFilter =
  | AgGridGreaterThanFilter
  | AgGridEqualsFilter
  | AgGridNotEqualFilter
  | AgGridLessThanFilter
  | AgGridSetFilter
  | AgGridGreaterThanOrEqualFilter
  | AgGridLessThanOrEqualFilter;

const agToSingleValueVuuFilterType = (
  type: string
): SingleValueFilterClauseOp => {
  switch (type) {
    case "startsWith":
      return "starts";
    case "greaterThan":
      return ">";
    case "lessThan":
      return "<";
    case "equals":
      return "=";
    case "notEquals":
      return "!=";
    default:
      throw Error(
        `@vuu-ui/ag0grid AgGridFilterUtils AgGrid filter type ${type} not supported`
      );
  }
};

export const agGridFilterModelToVuuFilter = (filterModel: {
  [key: string]: any;
}): [string, Filter | undefined] => {
  const filterClauses: Filter[] = [];
  Object.entries(filterModel).forEach(([column, agGridFilter]) => {
    const { filterType, filter: value, type, values } = agGridFilter;
    console.log(`column ${column}`, {
      filterType,
      values,
    });
    if (filterType === "set") {
      const filterClause: FilterClause = {
        op: "in",
        column,
        values,
      };
      filterClauses.push(filterClause);
    } else if (type === "lessThanOrEqual") {
      const filterClause: MultiClauseFilter = {
        op: "or",
        filters: [
          { op: "<", column, value },
          { op: "=", column, value },
        ],
      };
      filterClauses.push(filterClause);
    } else if (type === "greaterThanOrEqual") {
      const filterClause: MultiClauseFilter = {
        op: "or",
        filters: [
          { op: ">", column, value },
          { op: "=", column, value },
        ],
      };
      filterClauses.push(filterClause);
    } else if (filterType === "text" || filterType === "number") {
      const { type } = agGridFilter;
      const filterClause: FilterClause = {
        op: agToSingleValueVuuFilterType(type),
        column,
        value,
      };
      filterClauses.push(filterClause);
    } else {
      console.log(`filter type ${filterType}`);
    }
  });

  const vuuFilter: Filter | undefined =
    filterClauses.length === 0
      ? undefined
      : filterClauses.length === 1
      ? (filterClauses[0] as FilterClause)
      : ({
          op: "and",
          filters: filterClauses,
        } as AndFilter);

  const filterQuery = vuuFilter ? filterAsQuery(vuuFilter) : "";
  return [filterQuery, vuuFilter];
};
