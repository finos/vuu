import type { WorkspacePersistenceService } from "../persistence-manager";
import {
  WORKSPACE_SNAPSHOT_RECORD_VERSION,
  cloneWorkspaceValue,
  validateWorkspaceSnapshotV1,
  type WorkspaceSnapshotRecordV1,
  type WorkspaceSnapshotV1,
} from "./workspace-schemas";

interface Deferred {
  readonly reject: (error: Error) => void;
  readonly resolve: (record: WorkspaceSnapshotRecordV1) => void;
}

interface QueuedWrite {
  record: WorkspaceSnapshotRecordV1;
  readonly waiters: Deferred[];
}

export class WorkspaceRepositoryDisposedError extends Error {
  constructor() {
    super("Workspace repository has been disposed");
    this.name = "WorkspaceRepositoryDisposedError";
  }
}

export class WorkspaceRepository {
  readonly #service: WorkspacePersistenceService;
  readonly #workspaceInstanceId: string;
  #revision = 0;
  #current: WorkspaceSnapshotRecordV1 | undefined;
  #active: QueuedWrite | undefined;
  #activeWrite: Promise<void> | undefined;
  #pending: QueuedWrite | undefined;
  #generation = 0;
  #disposed = false;

  constructor(
    service: WorkspacePersistenceService,
    workspaceInstanceId: string,
    initial?: WorkspaceSnapshotRecordV1,
  ) {
    if (!workspaceInstanceId) {
      throw new Error("workspaceInstanceId must not be empty");
    }
    this.#service = service;
    this.#workspaceInstanceId = workspaceInstanceId;
    if (initial) {
      if (initial.workspaceInstanceId !== workspaceInstanceId) {
        throw new Error("Initial snapshot belongs to a different workspace");
      }
      this.#current = cloneWorkspaceValue(initial);
      this.#revision = initial.revision;
    }
  }

  get current(): WorkspaceSnapshotRecordV1 | undefined {
    return this.#current === undefined
      ? undefined
      : cloneWorkspaceValue(this.#current);
  }

  async load(): Promise<WorkspaceSnapshotRecordV1 | undefined> {
    this.#assertActive();
    const generation = this.#generation;
    const loaded = await this.#service.loadWorkspaceSnapshot(
      this.#workspaceInstanceId,
    );
    if (this.#disposed || generation !== this.#generation) {
      throw new WorkspaceRepositoryDisposedError();
    }
    if (loaded) {
      this.#revision = Math.max(this.#revision, loaded.revision);
      this.#current = cloneWorkspaceValue(loaded);
    }
    return this.current;
  }

  save(snapshot: WorkspaceSnapshotV1): Promise<WorkspaceSnapshotRecordV1> {
    this.#assertActive();
    const captured = cloneWorkspaceValue(validateWorkspaceSnapshotV1(snapshot));
    const record: WorkspaceSnapshotRecordV1 = {
      version: WORKSPACE_SNAPSHOT_RECORD_VERSION,
      workspaceInstanceId: this.#workspaceInstanceId,
      revision: ++this.#revision,
      snapshot: captured,
    };

    const promise = new Promise<WorkspaceSnapshotRecordV1>(
      (resolve, reject) => {
        const waiter = { reject, resolve };
        if (!this.#active) {
          this.#active = { record, waiters: [waiter] };
          this.#writeActive();
        } else if (this.#pending) {
          this.#pending.record = record;
          this.#pending.waiters.push(waiter);
        } else {
          this.#pending = { record, waiters: [waiter] };
        }
      },
    );
    return promise;
  }

  dispose(): Promise<void> {
    if (this.#disposed) {
      return this.#activeWrite ?? Promise.resolve();
    }
    this.#disposed = true;
    this.#generation += 1;
    const error = new WorkspaceRepositoryDisposedError();
    for (const queued of [this.#active, this.#pending]) {
      queued?.waiters.forEach(({ reject }) => {
        reject(error);
      });
    }
    this.#active = undefined;
    this.#pending = undefined;
    this.#current = undefined;
    return this.#activeWrite ?? Promise.resolve();
  }

  #writeActive(): void {
    const active = this.#active;
    if (!active) {
      return;
    }
    const generation = this.#generation;
    const write = this.#service.saveWorkspaceSnapshot(active.record).then(
      () => {
        if (!this.#disposed && generation === this.#generation) {
          this.#current = cloneWorkspaceValue(active.record);
          active.waiters.forEach(({ resolve }) => {
            resolve(cloneWorkspaceValue(active.record));
          });
        }
        this.#advance(active);
      },
      (error: unknown) => {
        const persistenceError =
          error instanceof Error
            ? error
            : new Error("Workspace snapshot persistence failed");
        if (!this.#disposed && generation === this.#generation) {
          active.waiters.forEach(({ reject }) => {
            reject(persistenceError);
          });
        }
        this.#advance(active);
      },
    );
    const trackedWrite = write.finally(() => {
      if (this.#activeWrite === trackedWrite) {
        this.#activeWrite = undefined;
      }
    });
    this.#activeWrite = trackedWrite;
  }

  #advance(completed: QueuedWrite): void {
    if (this.#disposed || this.#active !== completed) {
      return;
    }
    this.#active = this.#pending;
    this.#pending = undefined;
    this.#writeActive();
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new WorkspaceRepositoryDisposedError();
    }
  }
}
