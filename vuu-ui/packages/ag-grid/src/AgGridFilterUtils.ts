import { Filter, filterAsQuery } from "@vuu-ui/datagrid-parsers";
import { FilterClause } from "@vuu-ui/utils";

const agToVuuFilterType = (type: string) => {
  switch (type) {
    case "startsWith":
      return "starts";
    case "greaterThan":
      return ">";
    default:
      return type;
  }
};

export const agGridFilterModelToVuuFilter = (filterModel: {
  [key: string]: any;
}): [string, Filter] => {
  const filterClauses: FilterClause[] = [];
  Object.entries(filterModel).forEach(([column, agGridFilter]) => {
    const { filterType, values } = agGridFilter;
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
    } else if (filterType === "text") {
      const { type, filter: value } = agGridFilter;
      const filterClause: FilterClause = {
        op: agToVuuFilterType(type),
        column,
        value,
      };
      filterClauses.push(filterClause);
    } else if (filterType === "number") {
      const { type, filter: value } = agGridFilter;
      const filterClause: FilterClause = {
        op: agToVuuFilterType(type),
        column,
        value,
      };
      filterClauses.push(filterClause);
    } else {
      console.log(`filter type ${filterType}`);
    }
  });

  const vuuFilter =
    filterClauses.length === 1
      ? filterClauses[0]
      : {
          op: "and",
          filters: filterClauses,
        };

  const filterQuery = filterAsQuery(vuuFilter);
  return [filterQuery, vuuFilter];
};
