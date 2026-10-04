import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";

export type TableEditSessionEvents = {
  cellEditChanged: (key: string, columnName: string) => void;
};

/**
 * The subset of edit session behaviour consumed by Table and its cells.
 * Implemented by EditSession (edits staged in a session table, committed or
 * discarded at end of session) and DirectEditSession (edits applied directly
 * to the source table).
 */
export interface TableEditSession {
  /**
   * True while a staged edit session is in progress. Always false for
   * DirectEditSession.
   */
  readonly inEditMode: boolean;
  commit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    typedValue: string | number | boolean,
    isValid: boolean,
  ): Promise<RpcResult>;
  isCellEdited(key: string, columnName: string): boolean;
  on<E extends keyof TableEditSessionEvents>(
    event: E,
    listener: TableEditSessionEvents[E],
  ): void;
  removeListener<E extends keyof TableEditSessionEvents>(
    event: E,
    listener: TableEditSessionEvents[E],
  ): void;
}
