import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { createContext, useContext } from "react";

export type TableSourceStatus = "error" | "loading" | "ready";

export interface SelectedSourceTable {
  sourceId: string;
  table: VuuTable;
}

export interface TableRegistrationContextValue {
  registerTables: (sourceId: string, tables: VuuTable[]) => void;
  reportSourceStatus: (
    sourceId: string,
    status: TableSourceStatus,
    message?: string,
  ) => void;
  /** The table the user has selected, and the source that publishes it. */
  selectedTable?: SelectedSourceTable;
  unregisterTables: (sourceId: string) => void;
}

export const TableRegistrationContext =
  createContext<TableRegistrationContextValue | null>(null);

export const useTableRegistration = () => {
  const context = useContext(TableRegistrationContext);

  if (context === null) {
    throw Error("No TableRegistrationContext provider has been installed");
  }

  return context;
};
