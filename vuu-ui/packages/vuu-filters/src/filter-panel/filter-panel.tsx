import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { useEffect, useState } from "react";
import { FilterComponent } from "./filter-components/filter-selector";
import "./filter-panel.css";
import { IRange } from "./filter-components/range-filter";

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
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(
    null
  );
  const [allQueries, setAllQueries] = useState<{
    [key: string]: string;
  } | null>(null);
  const [filters, setFilters] = useState<{
    [key: string]: string[] | IRange | null;
  } | null>(null);

  useEffect(() => {
    if (allQueries) {
      const queryString = getFilterQuery(allQueries);
      onFilterSubmit(queryString);
    } else {
      onFilterSubmit("");
    }
  }, [allQueries, selectedColumnName, onFilterSubmit]);

  const getSelectedColumnType = () => {
    if (selectedColumnName) {
      const selectedColumn: ColumnDescriptor[] = columns.filter(
        (column) => column.name === selectedColumnName
      );

      return selectedColumn[0].serverDataType;
    }

    return undefined;
  };

  const handleColumnSelect: React.ChangeEventHandler<HTMLSelectElement> = ({
    currentTarget,
  }) => setSelectedColumnName(currentTarget.value);

  const handleClear = () => {
    setSelectedColumnName(null);
    setAllQueries(null);
    setFilters(null);
  };

  const localOnFilterSubmit = (
    newQuery: string,
    selectedFilters: string[] | IRange,
    columnName: string
  ) => {
    setFilters((filters) => {
      return { ...filters, [columnName]: selectedFilters };
    });

    if (selectedColumnName)
      setAllQueries({ ...allQueries, [selectedColumnName]: newQuery });
  };

  const getColumnSelectorOption = (name: string) => {
    return filters && filters[name] ? (
      <option className="has-filter">{name}</option>
    ) : (
      <option>{name}</option>
    );
  };

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
              columnType={getSelectedColumnType()}
              defaultTypeaheadParams={[table, selectedColumnName]}
              filters={filters ? filters[selectedColumnName] : null}
              onFilterSubmit={localOnFilterSubmit}
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

function getFilterQuery(
  allQueries: {
    [key: string]: string;
  } | null
) {
  let newQuery = "";

  if (allQueries) {
    Object.values(allQueries).forEach((query) => {
      if (query && query != "") {
        newQuery += query + " and ";
      }
    });

    newQuery = newQuery.slice(0, newQuery.length - 5);
  }

  return newQuery;
}
