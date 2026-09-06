import {
  DragDropProviderNext,
  GridLayoutProvider,
  type JsonValue,
} from "@heswell/grid-layout";
import { DataProvider } from "@vuu-ui/core";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import { getAllSchemas } from "@vuu-ui/vuu-data-test";
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
const tableSchemas = Object.values(getAllSchemas());
const tableFeature: DynamicFeatureDescriptor = {
  description: "Vuu Filter Table",
  featureProps: { vuuTables: "*" },
  id: "filter-table",
  leftNavLocation: "vuu-tables",
  location: "vuu-features",
  mfComponent: "default",
  mfScope: "filter-table",
  mfUrl: "../feature-filter-table/index.js",
  name: "filter-table",
  path: "filter-table",
  title: "Vuu Filter Table",
  version: 1,
};
const getTableServerAPI = async () => ({
  getTableList: async () => ({
    tables: tableSchemas.map(({ table }) => table),
  }),
  getTableSchema: async (table: (typeof tableSchemas)[number]["table"]) => {
    const schema = tableSchemas.find(
      ({ table: candidate }) =>
        candidate.module === table.module && candidate.table === table.table,
    );
    if (!schema) {
      throw new Error(`Unknown table ${table.module}:${table.table}`);
    }
    return schema;
  },
  rpcCall: async () => {
    throw new Error("RPC is not supported by this fixture");
  },
});

const tableNameFromSettings = (settings: JsonValue) => {
  if (
    typeof settings === "object" &&
    settings !== null &&
    !Array.isArray(settings)
  ) {
    const componentProps = settings.ComponentProps;
    if (
      typeof componentProps === "object" &&
      componentProps !== null &&
      !Array.isArray(componentProps)
    ) {
      const tableSchema = componentProps.tableSchema;
      if (
        typeof tableSchema === "object" &&
        tableSchema !== null &&
        !Array.isArray(tableSchema)
      ) {
        const table = tableSchema.table;
        if (
          typeof table === "object" &&
          table !== null &&
          !Array.isArray(table) &&
          typeof table.module === "string" &&
          typeof table.table === "string"
        ) {
          return `${table.module}:${table.table}`;
        }
      }
    }
  }
  throw new Error("Table feature settings do not identify a VUU table");
};

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

const TablePaletteGridShellFixture = () => {
  const persistenceService = useMemo(() => {
    const service = new LocalWorkspacePersistenceService({
      applicationId: "table-palette-shell",
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
          render: (settings: JsonValue, id) => (
            <div
              data-table-name={tableNameFromSettings(settings)}
              data-testid="dropped-table-feature"
              id={id}
            >
              {tableNameFromSettings(settings)}
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
      <DataProvider
        VuuDataSource={VuuDataSource}
        getServerAPI={getTableServerAPI}
        isLocalData={false}
      >
        <NotificationsProvider>
          <FeatureAndLayoutProvider dynamicFeatures={[tableFeature]}>
            <WorkspaceProvider
              componentRenderers={registries.renderers}
              persistenceService={persistenceService}
              settingsCodecs={registries.settingsCodecs}
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
      </DataProvider>
    </>
  );
};

export const EmptyGridShellWithTablePalette = () => (
  <TablePaletteGridShellFixture />
);
