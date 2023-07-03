import { Filter } from "@finos/vuu-filter-types";
import { useCallback, useState } from "react";
import { addFilter, AND, filterAsQuery } from "../filter-utils";
import { IRange } from "./RangeFilter";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { DataSourceFilter } from "@finos/vuu-data-types";

type SavedValue<T extends string[] | IRange> = { column: string; value: T };
type SavedFilter = { column: string; filter: Filter | undefined };

// Adds to or replaces an array value based on the chosen key of T
const addOrReplace = <T>(array: T[], newValue: T, key: keyof T): T[] =>
  array.filter((oldValue) => oldValue[key] !== newValue[key]).concat(newValue);

export const useColumnFilterStore = (
  onFilterSubmit: (filter: DataSourceFilter) => void
) => {
  const [selectedColumnName, setSelectedColumnName] = useState("");
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [rangeValues, setRangeValues] = useState<SavedValue<IRange>[]>([]);
  const [typeaheadValues, setTypeaheadValues] = useState<
    SavedValue<string[]>[]
  >([]);

  const clear = () => {
    setSelectedColumnName("");
    setRangeValues([]);
    setTypeaheadValues([]);
    setSavedFilters([]);
    onFilterSubmit({ filter: "" });
  };

  const updateFilters = useCallback(
    (newFilter?: Filter) => {
      const newSavedFilters = addOrReplace(
        savedFilters,
        { column: selectedColumnName, filter: newFilter },
        "column"
      );
      setSavedFilters(newSavedFilters);

      const combinedFilter = newSavedFilters
        .map((x) => x.filter)
        .reduce((prev, filter) => {
          if (filter === undefined) return prev;
          return addFilter(prev, filter, { combineWith: AND });
        }, undefined);

      const query =
        combinedFilter === undefined ? "" : filterAsQuery(combinedFilter);
      onFilterSubmit({ filter: query, filterStruct: combinedFilter });
    },
    [selectedColumnName, onFilterSubmit, savedFilters]
  );

  const onTypeaheadChange = useCallback(
    (newValues: string[], newFilter?: Filter) => {
      setTypeaheadValues(
        addOrReplace(
          typeaheadValues,
          { column: selectedColumnName, value: newValues },
          "column"
        )
      );
      updateFilters(newFilter);
    },
    [selectedColumnName, typeaheadValues, updateFilters]
  );

  const onRangeChange = useCallback(
    (newValues: IRange, newFilter?: Filter) => {
      setRangeValues(
        addOrReplace(
          rangeValues,
          { column: selectedColumnName, value: newValues },
          "column"
        )
      );
      updateFilters(newFilter);
    },
    [selectedColumnName, rangeValues, updateFilters]
  );

  const onSelectedColumnChange = useCallback(
    (column: ColumnDescriptor | null) =>
      setSelectedColumnName(column?.name || ""),
    []
  );

  const rangeValue = rangeValues.filter(
    (v) => v.column === selectedColumnName
  )[0]?.value;

  const typeaheadValue = typeaheadValues.filter(
    (v) => v.column === selectedColumnName
  )[0]?.value;

  return {
    clear,
    selectedColumnName,
    rangeValue,
    typeaheadValue,
    onSelectedColumnChange,
    onRangeChange,
    onTypeaheadChange,
  };
};
