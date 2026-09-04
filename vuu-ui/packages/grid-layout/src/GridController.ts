import {
  LegacyGridCommandExecutor,
  type GridCommand,
  type GridCommandResult,
} from "./GridCommand";
import {
  gridLayoutDescriptorToSnapshot,
  normalizeGridSnapshot,
} from "./grid-snapshot-adapters";
import type { GridModel, GridModelCheckpoint } from "./GridModel";
import type { GridSnapshot } from "./GridSnapshot";
import { toGridStackSnapshot } from "./GridStack";

export type GridTransactionKind = "drag" | "resize";
export type GridControllerListener = () => void;

export type GridControllerErrorCode =
  | "TRANSACTION_ACTIVE"
  | "TRANSACTION_CLOSED";

export interface GridControllerError {
  readonly code: GridControllerErrorCode;
  readonly message: string;
}

export type GridTransactionStartResult =
  | { readonly ok: true; readonly transaction: GridTransaction }
  | { readonly error: GridControllerError; readonly ok: false };

export type GridTransactionCloseResult =
  | { readonly ok: true; readonly snapshot: GridSnapshot }
  | { readonly error: GridControllerError; readonly ok: false };

export interface GridTransaction {
  readonly kind: GridTransactionKind;
  commit(): GridTransactionCloseResult;
  dispatch(command: GridCommand): GridCommandResult;
  replace(commands: readonly GridCommand[]): GridCommandResult;
  rollback(): GridTransactionCloseResult;
}

export interface GridCommittedTransition {
  readonly commands: readonly GridCommand[];
  readonly kind: "dispatch" | GridTransactionKind;
  readonly previous: GridSnapshot;
  readonly snapshot: GridSnapshot;
}

export type GridCommittedTransitionListener = (
  transition: GridCommittedTransition,
) => void;

const semanticSnapshot = ({ revision: _revision, ...snapshot }: GridSnapshot) =>
  JSON.stringify(snapshot);

const transactionError = (
  code: GridControllerErrorCode,
  message: string,
): GridControllerError => ({ code, message });

export class GridController {
  readonly #executor: LegacyGridCommandExecutor;
  readonly #listeners = new Set<GridControllerListener>();
  readonly #commitListeners = new Set<GridCommittedTransitionListener>();
  #activeTransaction: GridControllerTransaction | undefined;
  #snapshot: GridSnapshot;

  constructor(
    private readonly gridModel: GridModel,
    revision = 0,
    executor = new LegacyGridCommandExecutor(gridModel),
  ) {
    this.#executor = executor;
    this.#snapshot = this.#readSnapshot(revision);
  }

  getSnapshot = (): GridSnapshot => this.#snapshot;

  subscribe = (listener: GridControllerListener): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  subscribeCommitted = (
    listener: GridCommittedTransitionListener,
  ): (() => void) => {
    this.#commitListeners.add(listener);
    return () => {
      this.#commitListeners.delete(listener);
    };
  };

  dispatch(command: GridCommand): GridCommandResult {
    if (this.#activeTransaction) {
      return {
        command: command.type,
        error: transactionError(
          "TRANSACTION_ACTIVE",
          `Cannot dispatch ${command.type} while a grid transaction is active`,
        ),
        ok: false,
      };
    }

    const checkpoint = this.gridModel.createCheckpoint();
    const previous = this.#snapshot;
    const result = this.#executeAtomically(command, checkpoint);
    if (!result.ok) {
      return result;
    }
    const candidate = this.#readSnapshot(previous.revision);
    if (semanticSnapshot(candidate) === semanticSnapshot(previous)) {
      return result;
    }
    this.#snapshot = this.#readSnapshot(previous.revision + 1);
    this.#notifyState();
    this.#notifyCommitted({
      commands: [command],
      kind: "dispatch",
      previous,
      snapshot: this.#snapshot,
    });
    return result;
  }

  beginTransaction(kind: GridTransactionKind): GridTransactionStartResult {
    if (this.#activeTransaction) {
      return {
        error: transactionError(
          "TRANSACTION_ACTIVE",
          `Cannot begin ${kind}; a grid transaction is already active`,
        ),
        ok: false,
      };
    }
    let transaction: GridControllerTransaction;
    transaction = new GridControllerTransaction(
      kind,
      this.gridModel.createCheckpoint(),
      this.#snapshot,
      (command) => this.#executePreview(transaction, command),
      (commands) => this.#replacePreview(transaction, commands),
      (commands) =>
        this.#commitTransaction(
          transaction,
          kind,
          transaction.baseline,
          commands,
        ),
      () =>
        this.#rollbackTransaction(
          transaction,
          transaction.checkpoint,
          transaction.baseline,
        ),
    );
    this.#activeTransaction = transaction;
    return { ok: true, transaction };
  }

  #executePreview(
    transaction: GridControllerTransaction,
    command: GridCommand,
  ): GridCommandResult {
    if (this.#activeTransaction !== transaction) {
      return {
        command: command.type,
        error: transactionError(
          "TRANSACTION_CLOSED",
          `Cannot dispatch ${command.type}; the grid transaction is closed`,
        ),
        ok: false,
      };
    }

    const checkpoint = this.gridModel.createCheckpoint();
    const result = this.#executeAtomically(command, checkpoint);
    if (!result.ok) {
      return result;
    }
    const candidate = this.#readSnapshot(this.#snapshot.revision);
    if (semanticSnapshot(candidate) !== semanticSnapshot(this.#snapshot)) {
      this.#snapshot =
        semanticSnapshot(candidate) === semanticSnapshot(transaction.baseline)
          ? transaction.baseline
          : candidate;
      this.#notifyState();
    }
    return result;
  }

  #replacePreview(
    transaction: GridControllerTransaction,
    commands: readonly GridCommand[],
  ): GridCommandResult {
    const representative =
      commands[0] ?? ({ type: "regenerate-placeholders" } as const);
    if (this.#activeTransaction !== transaction) {
      return {
        command: representative.type,
        error: transactionError(
          "TRANSACTION_CLOSED",
          "Cannot replace preview; the grid transaction is closed",
        ),
        ok: false,
      };
    }

    this.gridModel.restoreCheckpoint(transaction.checkpoint);
    this.#snapshot = transaction.baseline;
    try {
      for (const command of commands) {
        const checkpoint = this.gridModel.createCheckpoint();
        const result = this.#executeAtomically(command, checkpoint);
        if (!result.ok) {
          this.gridModel.restoreCheckpoint(transaction.checkpoint);
          this.#snapshot = transaction.baseline;
          transaction.setCommands([]);
          this.#notifyState();
          return result;
        }
      }
    } catch (error) {
      this.gridModel.restoreCheckpoint(transaction.checkpoint);
      this.#snapshot = transaction.baseline;
      transaction.setCommands([]);
      this.#notifyState();
      throw error;
    }
    transaction.setCommands(commands);
    const candidate = this.#readSnapshot(transaction.baseline.revision);
    this.#snapshot =
      semanticSnapshot(candidate) === semanticSnapshot(transaction.baseline)
        ? transaction.baseline
        : candidate;
    this.#notifyState();
    return {
      command: representative.type,
      ok: true,
    };
  }

  #commitTransaction(
    transaction: GridControllerTransaction,
    kind: GridTransactionKind,
    baseline: GridSnapshot,
    commands: readonly GridCommand[],
  ): GridTransactionCloseResult {
    if (this.#activeTransaction !== transaction) {
      return this.#closedResult("commit");
    }
    const changed =
      semanticSnapshot(this.#snapshot) !== semanticSnapshot(baseline);
    this.#activeTransaction = undefined;
    if (!changed) {
      this.#snapshot = baseline;
      return { ok: true, snapshot: this.#snapshot };
    }
    this.#snapshot = this.#readSnapshot(baseline.revision + 1);
    this.#notifyState();
    this.#notifyCommitted({
      commands: [...commands],
      kind,
      previous: baseline,
      snapshot: this.#snapshot,
    });
    return { ok: true, snapshot: this.#snapshot };
  }

  #rollbackTransaction(
    transaction: GridControllerTransaction,
    checkpoint: GridModelCheckpoint,
    baseline: GridSnapshot,
  ): GridTransactionCloseResult {
    if (this.#activeTransaction !== transaction) {
      return this.#closedResult("rollback");
    }
    const changed =
      semanticSnapshot(this.#snapshot) !== semanticSnapshot(baseline);
    this.gridModel.restoreCheckpoint(checkpoint);
    this.#snapshot = baseline;
    this.#activeTransaction = undefined;
    if (changed) {
      this.#notifyState();
    }
    return { ok: true, snapshot: this.#snapshot };
  }

  #closedResult(action: "commit" | "rollback"): GridTransactionCloseResult {
    return {
      error: transactionError(
        "TRANSACTION_CLOSED",
        `Cannot ${action}; the grid transaction is closed`,
      ),
      ok: false,
    };
  }

  #executeAtomically(
    command: GridCommand,
    checkpoint: GridModelCheckpoint,
  ): GridCommandResult {
    try {
      const result = this.#executor.execute(command);
      if (!result.ok) {
        this.gridModel.restoreCheckpoint(checkpoint);
      }
      return result;
    } catch (error) {
      this.gridModel.restoreCheckpoint(checkpoint);
      throw error;
    }
  }

  #readSnapshot(revision: number): GridSnapshot {
    const snapshot = gridLayoutDescriptorToSnapshot(
      this.gridModel.toGridLayoutDescriptor(),
      { gridId: this.gridModel.id, revision },
    );
    // Stack membership, order and selection are read from canonical stack
    // state, not from the compatibility TabState projection.
    return normalizeGridSnapshot({
      ...snapshot,
      stacks: snapshot.stacks.map(({ id }) =>
        toGridStackSnapshot(this.gridModel.getStackState(id)),
      ),
    });
  }

  #notifyState() {
    for (const listener of [...this.#listeners]) {
      if (this.#listeners.has(listener)) {
        listener();
      }
    }
  }

  #notifyCommitted(transition: GridCommittedTransition) {
    for (const listener of [...this.#commitListeners]) {
      if (this.#commitListeners.has(listener)) {
        listener(transition);
      }
    }
  }
}

class GridControllerTransaction implements GridTransaction {
  readonly #commands: GridCommand[] = [];
  #closed = false;

  constructor(
    readonly kind: GridTransactionKind,
    readonly checkpoint: GridModelCheckpoint,
    readonly baseline: GridSnapshot,
    private readonly executePreview: (
      command: GridCommand,
    ) => GridCommandResult,
    private readonly replacePreview: (
      commands: readonly GridCommand[],
    ) => GridCommandResult,
    private readonly commitTransaction: (
      commands: readonly GridCommand[],
    ) => GridTransactionCloseResult,
    private readonly rollbackTransaction: () => GridTransactionCloseResult,
  ) {}

  dispatch(command: GridCommand): GridCommandResult {
    if (this.#closed) {
      return {
        command: command.type,
        error: transactionError(
          "TRANSACTION_CLOSED",
          `Cannot dispatch ${command.type}; the grid transaction is closed`,
        ),
        ok: false,
      };
    }

    const result = this.executePreview(command);
    if (result.ok) {
      this.#commands.push(command);
    }
    return result;
  }

  replace(commands: readonly GridCommand[]): GridCommandResult {
    if (this.#closed) {
      return {
        command: commands[0]?.type ?? "regenerate-placeholders",
        error: transactionError(
          "TRANSACTION_CLOSED",
          "Cannot replace preview; the grid transaction is closed",
        ),
        ok: false,
      };
    }
    return this.replacePreview(commands);
  }

  setCommands(commands: readonly GridCommand[]) {
    this.#commands.splice(0, this.#commands.length, ...commands);
  }

  commit(): GridTransactionCloseResult {
    if (this.#closed) {
      return {
        error: transactionError(
          "TRANSACTION_CLOSED",
          "Cannot commit; the grid transaction is closed",
        ),
        ok: false,
      };
    }
    const result = this.commitTransaction(this.#commands);
    if (result.ok) {
      this.#closed = true;
    }
    return result;
  }

  rollback(): GridTransactionCloseResult {
    if (this.#closed) {
      return {
        error: transactionError(
          "TRANSACTION_CLOSED",
          "Cannot rollback; the grid transaction is closed",
        ),
        ok: false,
      };
    }
    const result = this.rollbackTransaction();
    if (result.ok) {
      this.#closed = true;
    }
    return result;
  }
}
