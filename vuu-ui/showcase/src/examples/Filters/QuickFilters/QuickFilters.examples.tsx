import { QuickFilterProps, QuickFilters } from "@vuu-ui/vuu-filters";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo, useState } from "react";
import { LocalDataSourceProvider, getSchema } from "@vuu-ui/vuu-data-test";
import { useViewContext, View } from "@vuu-ui/vuu-layout";
import { setPersistentState } from "@vuu-ui/vuu-layout";
import { FilterHandler } from "@vuu-ui/vuu-filter-types";

const instrumentsSchema = getSchema("instruments");

const QuickFiltersTemplate = ({
  allowAddColumn,
  allowFind,
  onApplyFilter,
  onClearFilter,
  quickFilterColumns: quickFilterColumnsProp = [],
  vuuTable = instrumentsSchema.table,
  availableColumns = instrumentsSchema?.columns,
}: Partial<QuickFilterProps>) => {
  const initialColumns = useMemo(() => {
    return quickFilterColumnsProp;
  }, [quickFilterColumnsProp]);

  const [quickFilterColumns, setQuickFilterColumns] = useState(initialColumns);

  const handleApplyFilter = useCallback<FilterHandler>(
    (filter) => {
      onApplyFilter?.(filter);
    },
    [onApplyFilter],
  );
  const handleClearFilter = useCallback(() => {
    onClearFilter?.();
  }, [onClearFilter]);

  const handleChangeQuickFilterColumns = useCallback((columns: string[]) => {
    console.log("change columns", { columns });
    setQuickFilterColumns(columns);
  }, []);

  return (
    <QuickFilters
      allowAddColumn={allowAddColumn}
      allowFind={allowFind}
      availableColumns={availableColumns}
      onApplyFilter={handleApplyFilter}
      onClearFilter={handleClearFilter}
      onChangeQuickFilterColumns={handleChangeQuickFilterColumns}
      quickFilterColumns={quickFilterColumns}
      vuuTable={vuuTable}
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

export const OneColumn = () => {
  return (
    <QuickFiltersTemplate
      availableColumns={[{ name: "ClientID", serverDataType: "string" }]}
      quickFilterColumns={["ClientID"]}
    />
  );
};

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

export const ThreeColumnsOnly = () => {
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
      allowAddColumn={false}
      quickFilterColumns={quickFilterColumns}
    />
  );
};

export const QuickDateFilter = () => {
  const [availableColumns, quickFilterColumns] = useMemo<
    [ColumnDescriptor[], string[]]
  >(
    () => [
      [
        {
          label: "Trade Date",
          name: "tradeDate",
          serverDataType: "long",
          type: "date/time",
        },
        {
          label: "Settlement Date",
          name: "settlementDate",
          serverDataType: "long",
          type: "date/time",
        },
      ],
      ["tradeDate"],
    ],
    [],
  );
  return (
    <QuickFiltersTemplate
      availableColumns={availableColumns}
      allowAddColumn={true}
      allowFind={false}
      quickFilterColumns={quickFilterColumns}
    />
  );
};

const PersistentFilter = () => {
  const { load, save } = useViewContext();
  const quickFilters = useMemo<string[]>(
    () => (load?.("quick-filters") as string[]) ?? [],
    [load],
  );

  const applyFilter = useCallback<FilterHandler>((filter) => {
    console.log(JSON.stringify(filter, null, 2));
  }, []);

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
      onApplyFilter={applyFilter}
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
    <LocalDataSourceProvider>
      <View id={id}>
        <PersistentFilter />
      </View>
    </LocalDataSourceProvider>
  );
};
