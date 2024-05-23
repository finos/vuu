import { QuickFilterProps, QuickFilters } from "@finos/vuu-filters";
import type { DataSourceFilter } from "@finos/vuu-data-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { useCallback, useMemo } from "react";
import { getSchema, vuuModule } from "@finos/vuu-data-test";

let displaySequence = 1;

const QuickFiltersTemplate = ({
  availableColumns = [],
  onApplyFilter,
  quickFilterColumns,
  suggestionProvider,
  tableSchema,
}: Partial<QuickFilterProps>) => {
  const handleApplyFilter = useCallback(
    (filter: DataSourceFilter) => {
      onApplyFilter?.(filter);
      console.log(`apply filter `, {
        filter,
      });
    },
    [onApplyFilter]
  );

  return (
    <QuickFilters
      availableColumns={availableColumns}
      onApplyFilter={handleApplyFilter}
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
