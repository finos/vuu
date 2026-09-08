import type {
  ApplicationSessionV1,
  NamedWorkspaceDefinitionV1,
  NamedWorkspaceMetadataV1,
  WorkspaceSnapshotRecordV1,
} from "../workspace-management/workspace-schemas";

export interface PersistenceScope {
  readonly applicationNamespace: string;
  readonly applicationId: string;
}

export interface UserPersistenceScope extends PersistenceScope {
  readonly userId: string;
}

export interface WorkspacePersistenceService {
  readonly scope: UserPersistenceScope;

  loadApplicationSession(): Promise<ApplicationSessionV1 | undefined>;
  saveApplicationSession(session: ApplicationSessionV1): Promise<void>;
  deleteApplicationSession(): Promise<void>;

  listWorkspaceSnapshots(): Promise<readonly WorkspaceSnapshotRecordV1[]>;
  loadWorkspaceSnapshot(
    workspaceInstanceId: string,
  ): Promise<WorkspaceSnapshotRecordV1 | undefined>;
  saveWorkspaceSnapshot(snapshot: WorkspaceSnapshotRecordV1): Promise<void>;
  deleteWorkspaceSnapshot(workspaceInstanceId: string): Promise<void>;

  listNamedWorkspaceMetadata(): Promise<readonly NamedWorkspaceMetadataV1[]>;
  loadNamedWorkspaceDefinition(
    id: string,
  ): Promise<NamedWorkspaceDefinitionV1 | undefined>;
  saveNamedWorkspaceDefinition(
    definition: NamedWorkspaceDefinitionV1,
  ): Promise<void>;
  deleteNamedWorkspaceDefinition(id: string): Promise<void>;
}

export class WorkspacePersistenceError extends Error {
  constructor(
    message: string,
    readonly operation: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "WorkspacePersistenceError";
  }
}
