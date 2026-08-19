import {
  cloneWorkspaceValue,
  validateApplicationSessionV1,
  validateNamedWorkspaceDefinitionV1,
  validateNamedWorkspaceMetadataV1,
  validateWorkspaceSnapshotRecordV1,
  workspaceMetadata,
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type WorkspaceSnapshotRecordV1,
  WorkspaceValidationError,
} from "../workspace-management/workspace-schemas";
import type {
  UserPersistenceScope,
  WorkspacePersistenceService,
} from "./WorkspacePersistenceService";
import { WorkspacePersistenceError } from "./WorkspacePersistenceService";

type Validator<T> = (value: unknown) => T;

const validateScope = (scope: UserPersistenceScope) => {
  for (const [name, value] of Object.entries(scope)) {
    if (!value) {
      throw new WorkspacePersistenceError(
        `Persistence scope ${name} must not be empty`,
        "construct",
      );
    }
  }
};

const requireId = (id: string, operation: string): string => {
  if (!id) {
    throw new WorkspacePersistenceError(
      "Entity id must not be empty",
      operation,
    );
  }
  return id;
};

export class LocalWorkspacePersistenceService
  implements WorkspacePersistenceService
{
  readonly scope: UserPersistenceScope;
  readonly #storage: Storage;
  readonly #prefix: string;

  constructor(scope: UserPersistenceScope, storage: Storage = localStorage) {
    validateScope(scope);
    this.scope = Object.freeze({ ...scope });
    this.#storage = storage;
    this.#prefix = [
      "vuu-workspace",
      scope.applicationNamespace,
      scope.applicationId,
      scope.userId,
    ]
      .map(encodeURIComponent)
      .join(":");
  }

  async loadApplicationSession(): Promise<ApplicationSessionV1 | undefined> {
    return this.#read(
      "application-session",
      undefined,
      validateApplicationSessionV1,
    );
  }

  async saveApplicationSession(session: ApplicationSessionV1): Promise<void> {
    this.#write(
      "application-session",
      undefined,
      validateApplicationSessionV1(session),
    );
  }

  async deleteApplicationSession(): Promise<void> {
    this.#remove("application-session");
  }

  async listWorkspaceSnapshots(): Promise<
    readonly WorkspaceSnapshotRecordV1[]
  > {
    return this.#ids("snapshot").map((id) => {
      const snapshot = this.#read(
        "snapshot",
        id,
        validateWorkspaceSnapshotRecordV1,
      );
      if (!snapshot) {
        throw new WorkspacePersistenceError(
          `Snapshot index references missing workspace "${id}"`,
          "listWorkspaceSnapshots",
        );
      }
      return snapshot;
    });
  }

  async loadWorkspaceSnapshot(
    workspaceInstanceId: string,
  ): Promise<WorkspaceSnapshotRecordV1 | undefined> {
    return this.#read(
      "snapshot",
      requireId(workspaceInstanceId, "loadWorkspaceSnapshot"),
      validateWorkspaceSnapshotRecordV1,
    );
  }

  async saveWorkspaceSnapshot(
    snapshot: WorkspaceSnapshotRecordV1,
  ): Promise<void> {
    const validated = validateWorkspaceSnapshotRecordV1(snapshot);
    this.#write("snapshot", validated.workspaceInstanceId, validated);
    this.#addId("snapshot", validated.workspaceInstanceId);
  }

  async deleteWorkspaceSnapshot(workspaceInstanceId: string): Promise<void> {
    const id = requireId(workspaceInstanceId, "deleteWorkspaceSnapshot");
    this.#remove("snapshot", id);
    this.#deleteId("snapshot", id);
  }

  async listNamedWorkspaceMetadata(): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > {
    return this.#ids("definition").map((id) => {
      const metadata = this.#read(
        "definition-metadata",
        id,
        validateNamedWorkspaceMetadataV1,
      );
      if (!metadata) {
        throw new WorkspacePersistenceError(
          `Definition index references missing metadata "${id}"`,
          "listNamedWorkspaceMetadata",
        );
      }
      return metadata;
    });
  }

  async loadNamedWorkspaceDefinition(
    id: string,
  ): Promise<NamedWorkspaceDefinitionV1 | undefined> {
    return this.#read(
      "definition",
      requireId(id, "loadNamedWorkspaceDefinition"),
      validateNamedWorkspaceDefinitionV1,
    );
  }

  async saveNamedWorkspaceDefinition(
    definition: NamedWorkspaceDefinitionV1,
  ): Promise<void> {
    const validated = validateNamedWorkspaceDefinitionV1(definition);
    this.#write("definition", validated.id, validated);
    this.#write(
      "definition-metadata",
      validated.id,
      workspaceMetadata(validated),
    );
    this.#addId("definition", validated.id);
  }

  async deleteNamedWorkspaceDefinition(id: string): Promise<void> {
    const validatedId = requireId(id, "deleteNamedWorkspaceDefinition");
    this.#remove("definition", validatedId);
    this.#remove("definition-metadata", validatedId);
    this.#deleteId("definition", validatedId);
  }

  #key(entity: string, id?: string): string {
    return `${this.#prefix}:${encodeURIComponent(entity)}${
      id === undefined ? "" : `:${encodeURIComponent(id)}`
    }`;
  }

  #read<T>(
    entity: string,
    id: string | undefined,
    validator: Validator<T>,
  ): T | undefined {
    const stored = this.#storage.getItem(this.#key(entity, id));
    if (stored === null) {
      return undefined;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      throw new WorkspacePersistenceError(
        `Stored ${entity} is not valid JSON: ${error.message}`,
        `load:${entity}`,
      );
    }
    try {
      return cloneWorkspaceValue(validator(parsed));
    } catch (error) {
      if (!(error instanceof WorkspaceValidationError)) {
        throw error;
      }
      throw new WorkspacePersistenceError(
        `Stored ${entity} is invalid: ${error.message}`,
        `load:${entity}`,
      );
    }
  }

  #write(entity: string, id: string | undefined, value: unknown): void {
    this.#storage.setItem(
      this.#key(entity, id),
      JSON.stringify(cloneWorkspaceValue(value)),
    );
  }

  #remove(entity: string, id?: string): void {
    this.#storage.removeItem(this.#key(entity, id));
  }

  #ids(entity: "snapshot" | "definition"): readonly string[] {
    const stored = this.#storage.getItem(this.#key(`${entity}-index`));
    if (stored === null) {
      return [];
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      throw new WorkspacePersistenceError(
        `Stored ${entity} index is not valid JSON: ${error.message}`,
        `list:${entity}`,
      );
    }
    if (
      !Array.isArray(parsed) ||
      parsed.some((id) => typeof id !== "string" || !id) ||
      new Set(parsed).size !== parsed.length
    ) {
      throw new WorkspacePersistenceError(
        `Stored ${entity} index is invalid`,
        `list:${entity}`,
      );
    }
    return parsed;
  }

  #addId(entity: "snapshot" | "definition", id: string): void {
    const ids = this.#ids(entity);
    if (!ids.includes(id)) {
      this.#storage.setItem(
        this.#key(`${entity}-index`),
        JSON.stringify([...ids, id]),
      );
    }
  }

  #deleteId(entity: "snapshot" | "definition", id: string): void {
    const ids = this.#ids(entity).filter((existing) => existing !== id);
    this.#storage.setItem(this.#key(`${entity}-index`), JSON.stringify(ids));
  }
}
