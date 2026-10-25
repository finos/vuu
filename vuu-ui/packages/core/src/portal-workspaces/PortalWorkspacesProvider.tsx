import type {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
} from "@vuu-ui/grid-layout";
import { type ReactNode, useMemo } from "react";
import { useOptionalAuthenticatedUser } from "../auth/AuthenticationProvider";
import { ANONYMOUS_USER } from "../common-shell/PortalPersistenceRoot";
import { DEFAULT_PORTAL_ID } from "../persistence/LocalStoragePersistenceBackend";
import { LocalWorkspacePersistenceService } from "../workspace/LocalWorkspacePersistenceService";
import type { WorkspacePersistenceService } from "../workspace/WorkspacePersistenceService";
import { WorkspaceProvider } from "../workspace/WorkspaceProvider";
import type { NamedWorkspaceDefinitionV1 } from "../workspace/workspace-schemas";

/** Workspace persistence namespace of portal workspaces. */
export const PORTAL_WORKSPACE_NAMESPACE = "vuu-portal";

/** The `workspaces` option of `PortalShell`. */
export interface PortalWorkspacesOptions {
  /** Components that can be placed in a workspace. */
  componentRenderers?: GridComponentRendererRegistry;
  /** Actions in the workspace header, e.g. "Add panel". */
  headerActions?: ReactNode;
  /**
   * Where workspaces are saved. Pass a stable instance. Default: browser
   * local storage, scoped to the portal id and the signed in user.
   */
  persistenceService?: WorkspacePersistenceService;
  settingsCodecs?: GridComponentSettingsRegistry;
  /**
   * Rendered beside the workspace GridLayout, e.g. `<PanelsPalette />`, with
   * `<AddPanelButton />` in `headerActions` to open it.
   */
  sidePanel?: ReactNode;
  /**
   * Workspaces shipped with the portal. Users edit a personal copy and can
   * reset it to the default.
   */
  systemWorkspaces?: readonly NamedWorkspaceDefinitionV1[];
}

const createLocalService = (portalId: string, userId: string) => {
  try {
    return new LocalWorkspacePersistenceService({
      applicationId: portalId,
      applicationNamespace: PORTAL_WORKSPACE_NAMESPACE,
      userId,
    });
  } catch (error) {
    console.warn(
      "[PortalWorkspaces] local storage is not available, workspaces will not be saved",
      error,
    );
    return undefined;
  }
};

export interface PortalWorkspacesProviderProps {
  children: ReactNode;
  options: PortalWorkspacesOptions;
  portalId?: string;
}

/** Provides the workspace model to `PortalNav` and the workspace route. */
export const PortalWorkspacesProvider = ({
  children,
  options: {
    componentRenderers,
    persistenceService,
    settingsCodecs,
    systemWorkspaces,
  },
  portalId = DEFAULT_PORTAL_ID,
}: PortalWorkspacesProviderProps) => {
  const userId = useOptionalAuthenticatedUser()?.userName || ANONYMOUS_USER;
  const localService = useMemo(
    () =>
      persistenceService ? undefined : createLocalService(portalId, userId),
    [persistenceService, portalId, userId],
  );
  return (
    <WorkspaceProvider
      componentRenderers={componentRenderers}
      persistenceService={persistenceService ?? localService}
      settingsCodecs={settingsCodecs}
      systemWorkspaces={systemWorkspaces}
    >
      {children}
    </WorkspaceProvider>
  );
};
