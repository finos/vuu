import {
  cloneWorkspaceValue,
  validateApplicationSessionV1,
  validateNamedWorkspaceDefinitionV1,
  validateNamedWorkspaceMetadataV1,
  validateWorkspaceSnapshotRecordV1,
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type WorkspaceSnapshotRecordV1,
} from "../workspace-management/workspace-schemas";
import type {
  UserPersistenceScope,
  WorkspacePersistenceService,
} from "./WorkspacePersistenceService";
import { WorkspacePersistenceError } from "./WorkspacePersistenceService";

export type WorkspaceRequestInitProvider = () =>
  | RequestInit
  | Promise<RequestInit>;

export interface RemoteWorkspacePersistenceOptions {
  readonly baseUrl: string;
  readonly requestInit?: RequestInit;
  readonly requestInitProvider?: WorkspaceRequestInitProvider;
  readonly fetch?: typeof fetch;
}

type Validator<T> = (value: unknown) => T;

const trimSlash = (value: string) => value.replace(/\/+$/, "");
const requireId = (id: string, operation: string): string => {
  if (!id) {
    throw new WorkspacePersistenceError(
      "Entity id must not be empty",
      operation,
    );
  }
  return encodeURIComponent(id);
};

export class RemoteWorkspacePersistenceService
  implements WorkspacePersistenceService
{
  readonly scope: UserPersistenceScope;
  readonly #baseUrl: string;
  readonly #requestInit?: RequestInit;
  readonly #requestInitProvider?: WorkspaceRequestInitProvider;
  readonly #fetch: typeof fetch;

  constructor(
    scope: UserPersistenceScope,
    {
      baseUrl,
      requestInit,
      requestInitProvider,
      fetch: fetchImplementation = globalThis.fetch,
    }: RemoteWorkspacePersistenceOptions,
  ) {
    if (
      !scope.applicationNamespace ||
      !scope.applicationId ||
      !scope.userId ||
      !baseUrl
    ) {
      throw new WorkspacePersistenceError(
        "Remote persistence scope and base URL must not be empty",
        "construct",
      );
    }
    this.scope = Object.freeze({ ...scope });
    this.#baseUrl = trimSlash(baseUrl);
    this.#requestInit = requestInit;
    this.#requestInitProvider = requestInitProvider;
    this.#fetch = fetchImplementation;
  }

  async loadApplicationSession(): Promise<ApplicationSessionV1 | undefined> {
    return this.#optional(
      "loadApplicationSession",
      "application-session",
      validateApplicationSessionV1,
    );
  }

  async saveApplicationSession(session: ApplicationSessionV1): Promise<void> {
    await this.#void(
      "saveApplicationSession",
      "application-session",
      "PUT",
      validateApplicationSessionV1(session),
    );
  }

  async deleteApplicationSession(): Promise<void> {
    await this.#void(
      "deleteApplicationSession",
      "application-session",
      "DELETE",
    );
  }

  async listWorkspaceSnapshots(): Promise<
    readonly WorkspaceSnapshotRecordV1[]
  > {
    const value = await this.#json("listWorkspaceSnapshots", "snapshots");
    if (!Array.isArray(value)) {
      throw new WorkspacePersistenceError(
        "Remote snapshot list response must be an array",
        "listWorkspaceSnapshots",
      );
    }
    return value.map(validateWorkspaceSnapshotRecordV1);
  }

  async loadWorkspaceSnapshot(
    workspaceInstanceId: string,
  ): Promise<WorkspaceSnapshotRecordV1 | undefined> {
    return this.#optional(
      "loadWorkspaceSnapshot",
      `snapshots/${requireId(workspaceInstanceId, "loadWorkspaceSnapshot")}`,
      validateWorkspaceSnapshotRecordV1,
    );
  }

  async saveWorkspaceSnapshot(
    snapshot: WorkspaceSnapshotRecordV1,
  ): Promise<void> {
    const validated = validateWorkspaceSnapshotRecordV1(snapshot);
    await this.#void(
      "saveWorkspaceSnapshot",
      `snapshots/${encodeURIComponent(validated.workspaceInstanceId)}`,
      "PUT",
      validated,
    );
  }

  async deleteWorkspaceSnapshot(workspaceInstanceId: string): Promise<void> {
    await this.#void(
      "deleteWorkspaceSnapshot",
      `snapshots/${requireId(workspaceInstanceId, "deleteWorkspaceSnapshot")}`,
      "DELETE",
    );
  }

  async listNamedWorkspaceMetadata(): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > {
    const value = await this.#json(
      "listNamedWorkspaceMetadata",
      "named-workspaces",
    );
    if (!Array.isArray(value)) {
      throw new WorkspacePersistenceError(
        "Remote workspace metadata response must be an array",
        "listNamedWorkspaceMetadata",
      );
    }
    return value.map(validateNamedWorkspaceMetadataV1);
  }

  async loadNamedWorkspaceDefinition(
    id: string,
  ): Promise<NamedWorkspaceDefinitionV1 | undefined> {
    return this.#optional(
      "loadNamedWorkspaceDefinition",
      `named-workspaces/${requireId(id, "loadNamedWorkspaceDefinition")}`,
      validateNamedWorkspaceDefinitionV1,
    );
  }

  async saveNamedWorkspaceDefinition(
    definition: NamedWorkspaceDefinitionV1,
  ): Promise<void> {
    const validated = validateNamedWorkspaceDefinitionV1(definition);
    await this.#void(
      "saveNamedWorkspaceDefinition",
      `named-workspaces/${encodeURIComponent(validated.id)}`,
      "PUT",
      validated,
    );
  }

  async deleteNamedWorkspaceDefinition(id: string): Promise<void> {
    await this.#void(
      "deleteNamedWorkspaceDefinition",
      `named-workspaces/${requireId(id, "deleteNamedWorkspaceDefinition")}`,
      "DELETE",
    );
  }

  async #optional<T>(
    operation: string,
    path: string,
    validator: Validator<T>,
  ): Promise<T | undefined> {
    const response = await this.#request(operation, path, "GET");
    if (response.status === 404) {
      return undefined;
    }
    await this.#assertOk(response, operation);
    return cloneWorkspaceValue(validator(await response.json()));
  }

  async #json(operation: string, path: string): Promise<unknown> {
    const response = await this.#request(operation, path, "GET");
    await this.#assertOk(response, operation);
    return response.json();
  }

  async #void(
    operation: string,
    path: string,
    method: "PUT" | "DELETE",
    body?: unknown,
  ): Promise<void> {
    const response = await this.#request(operation, path, method, body);
    await this.#assertOk(response, operation);
  }

  async #request(
    operation: string,
    path: string,
    method: string,
    body?: unknown,
  ): Promise<Response> {
    const provided = this.#requestInitProvider
      ? await this.#requestInitProvider()
      : {};
    const configured = this.#requestInit ?? {};
    const headers = new Headers(configured.headers);
    new Headers(provided.headers).forEach((value, key) => {
      headers.set(key, value);
    });
    headers.set("Accept", "application/json");
    headers.set("X-Vuu-Application-Namespace", this.scope.applicationNamespace);
    headers.set("X-Vuu-Application-Id", this.scope.applicationId);
    headers.set("X-Vuu-User-Id", this.scope.userId);
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    const scopePath = [
      this.scope.applicationNamespace,
      this.scope.applicationId,
      this.scope.userId,
    ]
      .map(encodeURIComponent)
      .join("/");
    try {
      return await this.#fetch(`${this.#baseUrl}/${scopePath}/${path}`, {
        ...configured,
        ...provided,
        headers,
        method,
        body:
          body === undefined
            ? undefined
            : JSON.stringify(cloneWorkspaceValue(body)),
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      throw new WorkspacePersistenceError(error.message, operation);
    }
  }

  async #assertOk(response: Response, operation: string): Promise<void> {
    if (!response.ok) {
      throw new WorkspacePersistenceError(
        response.statusText ||
          `Remote persistence request failed (${response.status})`,
        operation,
        response.status,
      );
    }
  }
}
