import {
  DragDropProviderNext,
  GridLayoutProvider,
  type JsonValue,
} from "@heswell/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import {
  FeatureAndLayoutProvider,
  FeatureList,
  LocalWorkspacePersistenceService,
  StaticShellLayout,
  WorkspaceHost,
  WorkspaceProvider,
  createWorkspaceComponentRegistries,
  jsonValueWorkspaceComponentCodec,
} from "@vuu-ui/vuu-shell";
import type { DynamicFeatureDescriptor } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import shellCss from "../../../../packages/vuu-shell/src/shell.css";

const dynamicFeatures: DynamicFeatureDescriptor[] = [
  {
    description: "Test feature for the empty workspace drop target",
    id: "test-feature",
    leftNavLocation: "vuu-features",
    location: "vuu-features",
    mfComponent: "TestFeature",
    mfScope: "test",
    mfUrl: "test",
    name: "TestFeature",
    path: "test-feature",
    title: "Test Feature",
    version: 1,
  },
];

const paletteFeatures = [
  {
    mfComponent: "TestFeature",
    mfScope: "test",
    mfUrl: "test",
    title: "Test Feature",
  },
];
const NOOP = () => undefined;

const GridShellFixture = ({ withPalette = false }: { withPalette?: boolean }) => {
  const persistenceService = useMemo(() => {
    const service = new LocalWorkspacePersistenceService({
      applicationId: "empty-shell",
      applicationNamespace: "vuu-showcase",
      userId: "playwright",
    });
    void service.deleteApplicationSession();
    return service;
  }, []);
  const registries = useMemo(
    () =>
      createWorkspaceComponentRegistries([
        {
          codec: jsonValueWorkspaceComponentCodec,
          render: (_settings: JsonValue, id) => (
            <div data-testid="dropped-test-feature" id={id}>
              Test Feature
            </div>
          ),
          type: "vuu-dynamic-feature",
        },
      ]),
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
        <FeatureAndLayoutProvider dynamicFeatures={dynamicFeatures}>
          <WorkspaceProvider
            componentRenderers={registries.renderers}
            persistenceService={persistenceService}
            settingsCodecs={registries.settingsCodecs}
            userId="playwright"
          >
            <GridLayoutProvider>
              <DragDropProviderNext
                dragSources={{}}
                onCancelTabDrag={NOOP}
                onDetachTab={NOOP}
                onDrop={NOOP}
              >
                {withPalette ? (
                  <div
                    className="vuuGridLayout"
                    id="empty-shell-test-palette"
                    style={{
                      height: 200,
                      left: 250,
                      position: "fixed",
                      top: 50,
                      width: 300,
                      zIndex: 2,
                    }}
                  >
                    <FeatureList
                      features={paletteFeatures}
                      title="Drop Test"
                    />
                  </div>
                ) : null}
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
              </DragDropProviderNext>
            </GridLayoutProvider>
          </WorkspaceProvider>
        </FeatureAndLayoutProvider>
      </NotificationsProvider>
    </>
  );
};

export const EmptyGridShell = () => <GridShellFixture />;
export const EmptyGridShellWithPalette = () => (
  <GridShellFixture withPalette />
);
