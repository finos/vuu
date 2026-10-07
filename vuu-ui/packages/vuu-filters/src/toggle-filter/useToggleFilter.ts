import { useSavedFilters } from "../filter-provider/FilterContext";
import { useTypeaheadSuggestions } from "@vuu-ui/vuu-data-react";
import type { TypeaheadParams } from "@vuu-ui/vuu-protocol-types";
import { useCallback, useMemo, useRef, useState } from "react";
import { filtersAreEqual, getVuuTable } from "@vuu-ui/vuu-utils";
import type { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";

const assertValid = (values: string[], actualValues: string[]) => {
  if (actualValues.some((val) => values.indexOf(val) === -1)) {
    console.warn(`[useToggleFilter] ToggleFilter is configured with values which do not include all values from data source
            [${values.join()}]
            [${actualValues.join()}]`);
  }
};

export interface ToggleFilterHookProps {
  column: string;
  /**
   * table must be provided to enable validation
   * of values using server data.
   */
  table?: TableSchemaTable;
  values: string[];
}

export interface ToggleFilterHookResult {
  /**
   * If only one of the toggle values has matching data, that value.
   */
  onlyAvailableValue?: string;
  /**
   * Toggle values for which there is no matching data.
   */
  unavailableValues: string[];
}

const typeaheadRefreshRequired = (
  f1: FilterContainerFilter | null,
  f2: FilterContainerFilter | null,
) => {
  if (f1 === null && f2 === null) {
    return false;
  } else if (f1 === null || f2 === null) {
    return true;
  } else if (filtersAreEqual(f1, f2)) {
    return false;
  } else {
    return true;
  }
};

export const useToggleFilter = ({
  column,
  table,
  values,
}: ToggleFilterHookProps) => {
  const { currentFilter } = useSavedFilters();
  const currentFilterRef = useRef(currentFilter.filter);
  // undefined until we have a response, so we don't flag values as
  // unavailable before we know.
  const [typeaheadValues, setTypeaheadValues] = useState<string[] | undefined>(
    undefined,
  );
  const getSuggestions = useTypeaheadSuggestions();

  const refreshSuggestions = useCallback(
    (table: TableSchemaTable) => {
      const vuuTable = getVuuTable(table);
      const params: TypeaheadParams = [vuuTable, column];
      getSuggestions(params).then((suggestions) => {
        if (suggestions === false) {
          setTypeaheadValues(undefined);
        } else {
          assertValid(values, suggestions);
          setTypeaheadValues(suggestions);
        }
      });
    },
    [column, getSuggestions, values],
  );

  useMemo(() => {
    if (table) {
      refreshSuggestions(table);
    }
  }, [refreshSuggestions, table]);

  // Changes to currentFilter may affect the suggestions we receive
  // if it has changed and been applied to dataSource. If there is no FilterProvider
  // it will never change, so won't matter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const { current: filter } = currentFilterRef;
    if (table && typeaheadRefreshRequired(filter, currentFilter.filter)) {
      refreshSuggestions(table);
    }
    currentFilterRef.current = currentFilter.filter;
  }, [currentFilter.filter, refreshSuggestions, table]);

  return useMemo<ToggleFilterHookResult>(() => {
    if (typeaheadValues === undefined) {
      return { unavailableValues: [] };
    }
    return {
      onlyAvailableValue:
        typeaheadValues.length === 1 ? typeaheadValues[0] : undefined,
      unavailableValues: values.filter(
        (value) => !typeaheadValues.includes(value),
      ),
    };
  }, [typeaheadValues, values]);
};
