import { useTypeaheadSuggestions } from "@vuu-ui/vuu-data-react";
import type {
  DataSourceConfigChangeHandler,
  DataSourceFilter,
  TableSchemaTable,
} from "@vuu-ui/vuu-data-types";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import type { TypeaheadParams } from "@vuu-ui/vuu-protocol-types";
import {
  extractFilterForColumn,
  getVuuTable,
  useDataSource,
} from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const assertValid = (values: string[], actualValues: string[]) => {
  if (actualValues.some((val) => values.indexOf(val) === -1)) {
    console.warn(`[useToggleFilter] ToggleFilter is configured with values which do not include all values from data source
            [${values.join()}]
            [${actualValues.join()}]`);
  }
};

const hasFilterOnColumn = (
  filterSpec: DataSourceFilter | undefined,
  column: string,
) => {
  if (filterSpec === undefined || filterSpec.filter === "") {
    return false;
  }
  const filter = filterSpec.filterStruct ?? parseFilter(filterSpec.filter);
  return extractFilterForColumn(filter, column) !== undefined;
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

/**
 * Determines which toggle values have matching data, using typeahead
 * against the DataSource. Typeahead respects the filter applied to the
 * DataSource, so while a filter on this column is in effect, results
 * would only reflect the filtered value. In that case no check is made
 * and the result of the last check (if any) is retained. If there has
 * been no check, all values are assumed to possibly have data.
 */
export const useToggleFilter = ({
  column,
  table,
  values,
}: ToggleFilterHookProps): ToggleFilterHookResult => {
  const dataSource = useDataSource(false);
  // undefined until we have a response, so we don't flag values as
  // unavailable before we know.
  const [typeaheadValues, setTypeaheadValues] = useState<string[] | undefined>(
    undefined,
  );
  const getSuggestions = useTypeaheadSuggestions();
  const requestIdRef = useRef(0);
  // values and table are often passed as inline literals, use refs plus
  // stable keys so we don't re-check on every render.
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const valuesKey = values.join("\u0000");
  const vuuTable = table ? getVuuTable(table) : undefined;
  const tableModule = vuuTable?.module;
  const tableName = vuuTable?.table;

  const checkAvailability = useCallback(() => {
    if (
      tableModule === undefined ||
      tableName === undefined ||
      dataSource === undefined
    ) {
      return;
    }
    if (hasFilterOnColumn(dataSource.filter, column)) {
      return;
    }
    const requestId = ++requestIdRef.current;
    const params: TypeaheadParams = [
      { module: tableModule, table: tableName },
      column,
    ];
    getSuggestions(params).then((suggestions) => {
      if (requestId !== requestIdRef.current || suggestions === false) {
        return;
      }
      assertValid(valuesRef.current, suggestions);
      setTypeaheadValues(suggestions);
    });
  }, [column, dataSource, getSuggestions, tableModule, tableName]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // A change to the DataSource filter may change availability. Using the
  // DataSource config event (rather than FilterProvider currentFilter)
  // ensures the filter has been applied before we check.
  useEffect(() => {
    if (dataSource) {
      const handleConfigChange: DataSourceConfigChangeHandler = (
        _config,
        _range,
        _confirmed,
        configChanges,
      ) => {
        if (configChanges?.filterChanged) {
          checkAvailability();
        }
      };
      dataSource.on("config", handleConfigChange);
      return () => {
        dataSource.removeListener("config", handleConfigChange);
      };
    }
  }, [checkAvailability, dataSource]);

  return useMemo<ToggleFilterHookResult>(() => {
    if (typeaheadValues === undefined) {
      return { unavailableValues: [] };
    }
    return {
      onlyAvailableValue:
        typeaheadValues.length === 1 ? typeaheadValues[0] : undefined,
      unavailableValues: valuesRef.current.filter(
        (value) => !typeaheadValues.includes(value),
      ),
    };
    // valuesKey captures changes to values content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeaheadValues, valuesKey]);
};
