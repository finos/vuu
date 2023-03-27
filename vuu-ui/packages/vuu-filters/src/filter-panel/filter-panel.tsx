import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { useState } from "react";
import { IRange, RangeFilter } from "./filter-components/range-filter";
import { TypeaheadFilter } from "./filter-components/typeahead-filter";
import "./filter-panel.css";

type Query = { [key: string]: string };
type Filter<T extends string[] | IRange> = { [key: string]: T | undefined };

type FilterPanelProps = {
  table: VuuTable;
  columns: ColumnDescriptor[];
  onFilterSubmit: (filterQuery: string) => void;
};

export const FilterPanel = ({
  table,
  columns,
  onFilterSubmit,
}: FilterPanelProps) => {
  const [selectedColumnName, setSelectedColumnName] = useState("");
  const [queries, setQueries] = useState<Query>({});
  const [rangeFilters, setRangeFilters] = useState<Filter<IRange>>({});
  const [typeaheadFilters, setTypeaheadFilters] = useState<Filter<string[]>>(
    {}
  );

  const handleClear = () => {
    setSelectedColumnName("");
    setQueries({});
    setRangeFilters({});
    setTypeaheadFilters({});
    onFilterSubmit("");
  };

  const onTypeaheadFilterSubmit = (newFilter: string[], newQuery: string) => {
    setTypeaheadFilters({
      ...typeaheadFilters,
      [selectedColumnName]: newFilter,
    });
    updateQuery(newQuery);
  };

  const onRangeFilterSubmit = (newFilter: IRange, newQuery: string) => {
    setRangeFilters({
      ...rangeFilters,
      [selectedColumnName]: newFilter,
    });
    updateQuery(newQuery);
  };

  const updateQuery = (newQuery: string) => {
    const newQueries = {
      ...queries,
      [selectedColumnName]: newQuery,
    };
    setQueries(newQueries);
    onFilterSubmit(getFilterQuery(newQueries));
  };

  const selectedColumnType = columns.find(
    (column) => column.name === selectedColumnName
  )?.serverDataType;

  const getColumnSelectorOption = (columnName: string) => {
    const hasFilter =
      queries[columnName] !== undefined && queries[columnName] !== "";
    return (
      <option className={hasFilter ? "has-filter" : undefined}>
        {columnName}
      </option>
    );
  };

  const getFilterComponent = () => {
    const defaultTypeaheadParams: TypeaheadParams = [table, selectedColumnName];
    switch (selectedColumnType) {
      case "string":
      case "char":
        return (
          <TypeaheadFilter
            defaultTypeaheadParams={defaultTypeaheadParams}
            filterValues={typeaheadFilters[selectedColumnName]}
            onFilterSubmit={onTypeaheadFilterSubmit}
          />
        );
      case "int":
      case "long":
      case "double":
        return (
          <RangeFilter
            defaultTypeaheadParams={defaultTypeaheadParams}
            filterValues={rangeFilters[selectedColumnName]}
            onFilterSubmit={onRangeFilterSubmit}
          />
        );
      default:
        console.log("column type is not recognised");
        return null;
    }
  };

  return (
    <fieldset id="filter-panel">
      <div className="inline-block">
        <div>
          <label id="column-selector-label" className="block">
            Column
          </label>
          <select
            onChange={(e) => setSelectedColumnName(e.target.value)}
            id="column-selector"
            className="block"
            value={selectedColumnName}
          >
            <option disabled selected></option>
            {columns.map(({ name }) => getColumnSelectorOption(name))}
          </select>
        </div>
      </div>
      <div id="filter-component" className="inline-block">
        {selectedColumnName === "" ? null : (
          <div>
            {getFilterComponent()}
            <button
              className="clear-button"
              type="button"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </fieldset>
  );
};

const getFilterQuery = (queries: Query) =>
  Object.values(queries)
    .filter((query) => query !== undefined && query !== "")
    .join(" and ");
