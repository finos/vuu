import { ChangeEventHandler, useCallback, useEffect, useState } from "react";
import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filter-types";
import { ComboBoxDeprecated } from "@heswell/salt-lab";
import "./TypeaheadFilter.css";
import { getTypeaheadFilter, isStartsWithValue } from "../utils";

export type TypeaheadFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  onChange: (newValues: string[], filter?: Filter) => void;
  filterValues?: string[];
};

export const TypeaheadFilter = ({
  defaultTypeaheadParams,
  filterValues = [],
  onChange: onFilterChange,
}: TypeaheadFilterProps) => {
  const [tableName, columnName] = defaultTypeaheadParams;
  const [searchValue, setSearchValue] = useState("");
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();

  useEffect(() => {
    const params: TypeaheadParams = searchValue
      ? [tableName, columnName, searchValue]
      : defaultTypeaheadParams;

    let isSubscribed = true; 
    getSuggestions(params).then((options) => {
      if (!isSubscribed) {
        return;
      }
      if (isStartsWithValue(filterValues[0])) {
        options.unshift(filterValues[0]);
      }
      if (searchValue) {
        options.unshift(`${searchValue}...`);
      }
      options.concat(filterValues);
      setTypeaheadValues(options);
    });

    // Avoid memory leak
    return () => {
      isSubscribed = false;
    };
  }, [
    filterValues,
    searchValue,
    columnName,
    tableName,
    getSuggestions,
    defaultTypeaheadParams,
  ]);

  const onInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      const value = evt.target.value;
      setSearchValue(value);
    },
    []
  );

  const onSelectionChange = useCallback(
    (_evt, selected: string[]) => {
      setSearchValue("");
      if (selected === null) return;

      if (selected.some(isStartsWithValue)) {
        // Selecting a startsWith option removed other selections
        selected = selected.filter(isStartsWithValue).slice(-1);
      }

      const filter = getTypeaheadFilter(
        columnName,
        selected,
        isStartsWithValue(selected[0])
      );
      onFilterChange(selected, filter);
    },
    [columnName, onFilterChange]
  );

  return (
    <ComboBoxDeprecated
      key={columnName}
      multiSelect
      onInputChange={onInputChange}
      onChange={onSelectionChange}
      source={typeaheadValues}
      style={{ minWidth: 200 }}
      inputValue={searchValue}
      selectedItem={filterValues}
    />
  );
};
