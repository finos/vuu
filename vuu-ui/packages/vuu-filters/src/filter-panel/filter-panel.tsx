import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { TypeaheadParams, VuuTable } from "@finos/vuu-protocol-types";
import { useState } from "react";
import {
  addFilter,
  filterAsQuery,
  filterIncludesColumn,
} from "../filter-utils";
import { IRange, RangeFilter } from "./filter-components/range-filter";
import { TypeaheadFilter } from "./filter-components/typeahead-filter";
import "./filter-panel.css";

type ValueMap<T extends string[] | IRange> = { [key: string]: T | undefined };
type FilterWrapper = { [key: string]: Filter | undefined };

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
  const [filters, setFilters] = useState<FilterWrapper>({});
  const [rangeValues, setRangeValues] = useState<ValueMap<IRange>>({});
  const [typeaheadValues, setTypeaheadValues] = useState<ValueMap<string[]>>(
    {}
  );

  const handleClear = () => {
    setSelectedColumnName("");
    setRangeValues({});
    setTypeaheadValues({});
    setFilters({});
    onFilterSubmit("");
  };

  const onTypeaheadFilterSubmit = (newValues: string[], newFilter?: Filter) => {
    setTypeaheadValues({
      ...typeaheadValues,
      [selectedColumnName]: newValues,
    });
    const newFilters = { ...filters, [selectedColumnName]: newFilter };
    setFilters(newFilters);
    onFilterSubmit(getFilterQuery(newFilters));
  };

  const onRangeFilterSubmit = (newValues: IRange, newFilter?: Filter) => {
    setRangeValues({
      ...rangeValues,
      [selectedColumnName]: newValues,
    });
    const newFilters = { ...filters, [selectedColumnName]: newFilter };
    setFilters(newFilters);
    onFilterSubmit(getFilterQuery(newFilters));
  };

  const selectedColumnType = columns.find(
    (column) => column.name === selectedColumnName
  )?.serverDataType;

  const getColumnSelectorOption = (columnName: string) => {
    const combinedFilter = getCombinedFilter(filters);
    const column = columns.find((c) => c.name === columnName);
    const hasFilter =
      combinedFilter !== undefined &&
      column !== undefined &&
      filterIncludesColumn(combinedFilter, column);

    return (
      <option key={columnName} className={hasFilter ? "has-filter" : undefined}>
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
            filterValues={typeaheadValues[selectedColumnName]}
            onFilterSubmit={onTypeaheadFilterSubmit}
          />
        );
      case "int":
      case "long":
      case "double":
        return (
          <RangeFilter
            defaultTypeaheadParams={defaultTypeaheadParams}
            filterValues={rangeValues[selectedColumnName]}
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
            <option disabled></option>
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

const getCombinedFilter = (myFilters: FilterWrapper) =>
  Object.values(myFilters).reduce((prev, filter) => {
    if (filter === undefined) return prev;
    return addFilter(prev, filter, { combineWith: "and" });
  }, undefined);

const getFilterQuery = (myFilters: FilterWrapper) => {
  const filter = getCombinedFilter(myFilters);
  if (filter === undefined) return "";
  return filterAsQuery(filter);
};
