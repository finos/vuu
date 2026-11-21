export * from "./SaveLayoutPanel";
export * from "./LayoutList";
export * from "./defaultWorkspaceJSON";
export * from "./useWorkspaceContextMenuItems";
export * from "./shell-workspace-components";
/**
 * The workspace model now lives in @vuu-ui/core. These re-exports keep
 * existing @vuu-ui/vuu-shell imports working.
 */
export {
  APPLICATION_SESSION_VERSION,
  type ApplicationSessionV1,
  type ComponentPersistentStateV1,
  type ComponentStateUpdate,
  cloneWorkspaceValue,
  createWorkspaceComponentRegistries,
  emptyWorkspaceSnapshot,
  jsonValueWorkspaceComponentCodec,
  NAMED_WORKSPACE_DEFINITION_VERSION,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type OpenWorkspaceInstanceV1,
  StaleWorkspaceScopeError,
  useComponentPersistentState,
  useWorkspace,
  useWorkspacePersistentStateStore,
  validateApplicationSessionV1,
  validateNamedWorkspaceDefinitionV1,
  validateNamedWorkspaceMetadataV1,
  validateWorkspaceSnapshotRecordV1,
  validateWorkspaceSnapshotV1,
  WORKSPACE_SNAPSHOT_RECORD_VERSION,
  WORKSPACE_SNAPSHOT_VERSION,
  type WorkspaceComponentRegistration,
  type WorkspaceComponentRegistries,
  type WorkspaceContextValue,
  WorkspaceController,
  type WorkspaceControllerOptions,
  WorkspaceHost,
  type WorkspaceKind,
  workspaceMetadata,
  WorkspacePersistentStateProvider,
  type WorkspacePersistentStateProviderProps,
  WorkspacePersistentStateStore,
  type WorkspaceProps,
  WorkspaceProvider,
  type WorkspaceProviderProps,
  WorkspaceRepository,
  WorkspaceRepositoryDisposedError,
  type WorkspaceSchemaName,
  type WorkspaceSnapshotRecordV1,
  type WorkspaceSnapshotV1,
  WorkspaceStartPanel,
  type WorkspaceStatus,
  type WorkspaceSummary,
  WorkspaceValidationError,
  type WorkspaceValidationIssue,
} from "@vuu-ui/core";
