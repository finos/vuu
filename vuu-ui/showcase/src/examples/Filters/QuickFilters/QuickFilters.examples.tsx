import { QuickFilterProps, QuickFilters } from "@finos/vuu-filters";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { useCallback, useMemo, useState } from "react";
import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { IPersistenceManager, LocalPersistenceManager } from "@finos/vuu-shell";
import { basketSchemas } from "@finos/vuu-data-test";

let displaySequence = 1;

const QuickFiltersTemplate = ({
  availableColumns = [],
  onApplyFilter,
  persistenceKey,
  quickFilterColumns: quickFilterColumnsProp,
  suggestionProvider,
  tableSchema,
}: Partial<QuickFilterProps> & {
    persistenceKey?: string
}) => {

  const initialColumns = useMemo(() => {
    return quickFilterColumnsProp;
  },[quickFilterColumnsProp])

  const [quickFilterColumns, setQuickFilterColumns] = useState(initialColumns)

  const persistenceManager = useMemo<IPersistenceManager | undefined>(() => 
    persistenceKey ? new LocalPersistenceManager(persistenceKey) : undefined
  ,[persistenceKey])


  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      onApplyFilter?.(filter);
      console.log(`apply filter `, {
        filter,
      });
    },
    [onApplyFilter]
  );

  const handleChangeQuickFilterColumns = useCallback((columns: string[]) => {
    console.log('change columns',{columns})
  },[])

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
  const tableSchema = useMemo(() => getSchema("instruments"), []);
  const { typeaheadHook } = vuuModule("SIMUL");

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
    []
  );
  return (
    <QuickFiltersTemplate
      availableColumns={availableColumns}
      quickFilterColumns={quickFilterColumns}
      suggestionProvider={typeaheadHook}
      tableSchema={tableSchema}
    />
  );
};
ThreeColumns.displaySequence = displaySequence++;

export const WithPersistence = () => {

  const columns = useMemo(() => 
    basketSchemas.basketTradingConstituentJoin.columns
  ,[])

  return (
    <QuickFiltersTemplate
      availableColumns={columns}
      persistenceKey="quick-filters-with-persistence"
    />
  );
};
SearchOnly.displaySequence = displaySequence++;
