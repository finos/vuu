import { QuickFilterProps, QuickFilters } from "@finos/vuu-filters";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { useCallback, useMemo, useState } from "react";
import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { useViewContext, View } from "@finos/vuu-layout";
import { setPersistentState } from "@finos/vuu-layout";

let displaySequence = 1;

const QuickFiltersTemplate = ({
  onApplyFilter,
  quickFilterColumns: quickFilterColumnsProp = [],
  suggestionProvider = vuuModule("SIMUL").typeaheadHook,
  tableSchema = getSchema("instruments"),
  availableColumns = tableSchema?.columns,
}: Partial<QuickFilterProps>) => {
  const initialColumns = useMemo(() => {
    return quickFilterColumnsProp;
  }, [quickFilterColumnsProp]);

  const [quickFilterColumns, setQuickFilterColumns] = useState(initialColumns);

  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      onApplyFilter?.(filter);
      console.log(`apply filter `, {
        filter,
      });
    },
    [onApplyFilter],
  );

  const handleChangeQuickFilterColumns = useCallback((columns: string[]) => {
    console.log("change columns", { columns });
    setQuickFilterColumns(columns);
  }, []);

  return (
    <QuickFilters
      availableColumns={availableColumns}
      onApplyFilter={handleApplyFilter}
      onChangeQuickFilterColumns={handleChangeQuickFilterColumns}
      quickFilterColumns={quickFilterColumns}
      suggestionProvider={suggestionProvider}
      tableSchema={tableSchema}
    />
  );
};

export const SearchOnly = () => {
  return (
    <QuickFiltersTemplate
      availableColumns={[{ name: "ClientID", serverDataType: "string" }]}
    />
  );
};
SearchOnly.displaySequence = displaySequence++;

export const OneColumn = () => {
  return (
    <QuickFiltersTemplate
      availableColumns={[{ name: "ClientID", serverDataType: "string" }]}
      quickFilterColumns={["ClientID"]}
    />
  );
};
OneColumn.displaySequence = displaySequence++;

export const ThreeColumns = () => {
  const [availableColumns, quickFilterColumns] = useMemo<
    [ColumnDescriptor[], string[]]
  >(
    () => [
      [
        { label: "Currency", name: "currency", serverDataType: "string" },
        { name: "description", serverDataType: "string" },
        {
          label: "Exchange",
          name: "exchange",
          serverDataType: "string",
        },
      ],
      ["currency", "description", "exchange"],
    ],
    [],
  );
  return (
    <QuickFiltersTemplate
      availableColumns={availableColumns}
      quickFilterColumns={quickFilterColumns}
    />
  );
};
ThreeColumns.displaySequence = displaySequence++;

const PersistentFilter = () => {
  const { load, save } = useViewContext();
  const quickFilters = useMemo<string[]>(
    () => (load?.("quick-filters") as string[]) ?? [],
    [load],
  );

  const saveFilters = useCallback(
    (columns: string[]) => {
      // this won't do anything useful in this context
      // state will be saved in persistent-state store but because
      // we are not rendered within a LayoutProvider, there will be
      // no interaction with PersistenceManager to save state across
      // sessions
      save?.(columns, "quick-filters");
    },
    [save],
  );

  return (
    <QuickFiltersTemplate
      onChangeQuickFilterColumns={saveFilters}
      quickFilterColumns={quickFilters}
    />
  );
};

export const WithPersistence = () => {
  const id = "with-persistence-test";
  useMemo(() => {
    // 2) load time operation, normally performed during deserialization of UI from JSON
    setPersistentState(id, { "quick-filters": ["currency"] });
  }, []);

  return (
    <View id={id}>
      <PersistentFilter />
    </View>
  );
};
WithPersistence.displaySequence = displaySequence++;
