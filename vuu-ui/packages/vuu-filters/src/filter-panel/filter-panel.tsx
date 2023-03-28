import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { useEffect, useState } from "react";
import { FilterComponent } from "./filter-components/filter-selector";
import "./filter-panel.css";
import { IRange } from "./filter-components/range-filter";

export const FilterPanel = ({ table, columns, onFilterSubmit }: Props) => {
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<Filter>({});
  const [queries, setQueries] = useState<Query>({});

  useEffect(() => {
    const queryString = getQueryString(queries);
    onFilterSubmit(queryString);
  }, [queries]);

  const handleColumnSelect: React.ChangeEventHandler<HTMLSelectElement> = ({
    currentTarget,
  }) => setSelectedColumnName(currentTarget.value);

  const handleClear = () => {
    setSelectedColumnName(null);
    setQueries({});
    setFilters({});
  };

  const handleFilterSubmit = (
    newQuery: string,
    selectedFilters: string[] | IRange
  ) => {
    if (selectedColumnName) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [selectedColumnName]: selectedFilters,
      }));
      setQueries((prevQueries) => ({
        ...prevQueries,
        [selectedColumnName]: newQuery,
      }));
    }
  };

  const getColumnSelectorOption = (name: string) => {
    const hasFilter = filters[name] != null;
    return (
      <option className={hasFilter ? "has-filter" : undefined}>{name}</option>
    );
  };

  const selectedColumn = columns.find(
    (column) => column.name === selectedColumnName
  );
  const columnType = selectedColumn?.serverDataType;

  return (
    <fieldset id="filter-panel">
      <div className="inline-block">
        <div>
          <label id="column-selector-label" className="block">
            Column
          </label>
          <select
            onChange={handleColumnSelect}
            id="column-selector"
            className="block"
          >
            <option disabled selected></option>
            {columns.map(({ name }) => getColumnSelectorOption(name))}
          </select>
        </div>
      </div>
      <div id="filter-component" className="inline-block">
        {selectedColumnName ? (
          <div>
            <FilterComponent
              columnType={columnType}
              defaultTypeaheadParams={[table, selectedColumnName]}
              filters={filters[selectedColumnName]}
              onFilterSubmit={handleFilterSubmit}
            />
            <button
              className="clear-button"
              type="button"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>
    </fieldset>
  );
};

function getQueryString(queries: Query) {
  const queryString = Object.values(queries)
    .filter((query) => query != null && query !== "")
    .join(" and ");
  return queryString;
}

interface Filter {
  [key: string]: string[] | IRange | null;
}

interface Query {
  [key: string]: string;
}

interface Props {
  table: VuuTable;
  columns: ColumnDescriptor[];
  onFilterSubmit: (queryString: string) => void;
}
