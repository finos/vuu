import { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";
import { FilterDisplay } from "@vuu-ui/vuu-filters";

export const SingleFilterClause = () => {
  const filter: FilterContainerFilter = {
    column: "currency",
    op: "=",
    value: "GBP",
  };
  return <FilterDisplay filter={filter} />;
};

export const BetweenFilterClause = () => {
  const filter: FilterContainerFilter = {
    op: "and",
    filters: [
      {
        column: "price",
        op: ">",
        value: 1000,
      },
      {
        column: "price",
        op: "<",
        value: 2000,
      },
    ],
  };
  return <FilterDisplay filter={filter} />;
};

export const MultipleFilterClauses = () => {
  const filter: FilterContainerFilter = {
    op: "and",
    filters: [
      {
        column: "currency",
        op: "=",
        value: "GBP",
      },
      {
        column: "exchange",
        op: "=",
        value: "XLON/SETS",
      },
    ],
  };
  return <FilterDisplay filter={filter} />;
};

export const MultipleFilterClausesWithBetween = () => {
  const filter: FilterContainerFilter = {
    op: "and",
    filters: [
      {
        column: "currency",
        op: "=",
        value: "GBP",
      },
      {
        column: "exchange",
        op: "=",
        value: "XLON/SETS",
      },
      {
        op: "and",
        filters: [
          {
            column: "price",
            op: ">",
            value: 1000,
          },
          {
            column: "price",
            op: "<",
            value: 2000,
          },
        ],
      },
    ],
  };
  return <FilterDisplay filter={filter} />;
};
