import type {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
} from "@vuu-ui/grid-layout";
import { type ReactNode, useMemo } from "react";
import type { PanelsPaletteProps } from "../panels-palette/PanelsPalette";
import type { WorkspaceEmptyContent } from "../panels-palette/WorkspaceDropZone";
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
  /**
   * Content of an empty workspace when the Panels palette is available,
   * e.g. after "+ New workspace": a node, or a function that receives
   * `{ openPalette }` and returns one. Default: a `WorkspaceDropZone`.
   */
  emptyContent?: WorkspaceEmptyContent;
  /**
   * Actions in the workspace header, e.g. `<AddPanelButton />`, which opens
   * the Panels palette in the shell's context panel.
   */
  headerActions?: ReactNode;
  /**
   * Options of the Panels palette that `<AddPanelButton />` opens, e.g.
   * `{ tabs: ["modules", "tables", "recent"] }` to offer the Tables tab,
   * which is not shown by default.
   */
  palette?: PanelsPaletteProps;
  /**
   * Where workspaces are saved. Pass a stable instance. Default: browser
   * local storage, scoped to the portal id and the signed in user.
   */
  persistenceService?: WorkspacePersistenceService;
  settingsCodecs?: GridComponentSettingsRegistry;
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
