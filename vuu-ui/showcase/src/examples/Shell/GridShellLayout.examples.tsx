import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import {
  FeatureAndLayoutProvider,
  LocalWorkspacePersistenceService,
  StaticShellLayout,
  WorkspaceHost,
  WorkspaceProvider,
} from "@vuu-ui/vuu-shell";
import { useMemo } from "react";
import shellCss from "../../../../packages/vuu-shell/src/shell.css";

export const EmptyGridShell = () => {
  const persistenceService = useMemo(() => {
    const service = new LocalWorkspacePersistenceService({
      applicationId: "empty-shell",
      applicationNamespace: "vuu-showcase",
      userId: "playwright",
    });
    void service.deleteApplicationSession();
    return service;
  }, []);
  const componentRenderers = useMemo(
    () => new GridComponentRendererRegistry(),
    [],
  );
  const settingsCodecs = useMemo(
    () => new GridComponentSettingsRegistry(),
    [],
  );

  return (
    <>
      <style>{`${shellCss}
html, body, #root {
  height: 100%;
  margin: 0;
  overflow: hidden;
  width: 100%;
}`}</style>
      <NotificationsProvider>
        <FeatureAndLayoutProvider>
          <WorkspaceProvider
            componentRenderers={componentRenderers}
            persistenceService={persistenceService}
            settingsCodecs={settingsCodecs}
            userId="playwright"
          >
            <GridLayoutProvider>
              <StaticShellLayout
                appHeader={
                  <header aria-label="Application Header">
                    Application Header
                  </header>
                }
                data-testid="shell"
                leftNavWidth={240}
                workspaceHost={<WorkspaceHost />}
              />
            </GridLayoutProvider>
          </WorkspaceProvider>
        </FeatureAndLayoutProvider>
      </NotificationsProvider>
    </>
  );
};
