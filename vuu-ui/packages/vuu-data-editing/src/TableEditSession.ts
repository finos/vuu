import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";

/** The edit of one cell, as part of a change. */
export type CellChange = {
  key: string;
  column: string;
  /** The value of the cell before the edit. */
  previous: VuuRowDataItemType;
  value: VuuRowDataItemType;
};
export type CommitChangeOptions = {
  /** Add the edits to the latest change, so they are undone with it. */
  extendLastChange?: boolean;
};

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
  /**
   * Invoked when user abandons an in-progress cell edit, restoring the value
   * the cell held before editing began. Values that have only been typed, not
   * committed, have never been sent to the server, so nothing is sent here.
   * Any invalid edit previously recorded for the cell is discarded.
   */
  cancel(
    key: string,
    columnName: string,
    restoredValue: VuuRowDataItemType,
  ): Promise<RpcResult>;
  /**
   * Commits the edits of several cells as one change. Resolves to the first
   * error, if any; the other edits are still made.
   */
  commitChange(
    edits: readonly CellChange[],
    options?: CommitChangeOptions,
  ): Promise<RpcResult>;
  /**
   * Reverts the latest change. Only a staged edit session keeps a history
   * of changes.
   */
  undoLastChange?(): Promise<RpcResult>;
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
