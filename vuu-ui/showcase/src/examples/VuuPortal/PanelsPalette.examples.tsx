import {
  AuthenticationProvider,
  type NamedWorkspaceDefinitionV1,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import {
  AddPanelButton,
  createPortalComponentRegistries,
  type PortalModuleRenderer,
  PortalLandingPage,
  PortalNav,
  PortalShell,
  type PortalWorkspacesOptions,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import {
  basketModule,
  createLocalVuuServer,
  simulModule,
} from "@vuu-ui/vuu-data-test";
import type { GridLayoutDocument } from "@vuu-ui/grid-layout";
import { chartIcon, ordersIcon, watchlistIcon } from "./portal-nav-icons";

const SERVER_ID = "local";

const localServers = [
  createLocalVuuServer({
    connectionId: SERVER_ID,
    modules: [simulModule, basketModule],
  }),
];

const remoteModule = (
  name: string,
  title: string,
  overrides: Partial<RemoteModuleDescriptor> = {},
): RemoteModuleDescriptor => ({
  accessRole: `${name}-access`,
  clientIdentifier: `vuu-${name}`,
  description: `${title} remote module`,
  id: name,
  mfComponent: title,
  mfScope: name,
  mfUrl: `http://localhost:5001/${name}/mf-manifest.json`,
  name,
  navLocation: `/Apps/${title}`,
  path: `/${name}`,
  title,
  version: 1,
  ...overrides,
});

const remoteModules = [
  remoteModule("basket-trading", "Basket Trading", {
    description: "Build and execute baskets",
    navIconUrl: ordersIcon,
    workspace: { defaultSize: { cols: 2 }, paletteGroup: "Trading" },
  }),
  remoteModule("order-entry", "Order entry", {
    description: "Single order ticket",
    workspace: { paletteGroup: "Trading" },
  }),
  remoteModule("price-chart", "Price chart", {
    description: "Intraday prices",
    navIconUrl: chartIcon,
    workspace: { defaultSize: { rows: 2 }, paletteGroup: "Analytics" },
  }),
  remoteModule("saved-state-demo", "Saved state demo", {
    description: "Remembers its settings",
    navIconUrl: watchlistIcon,
    workspace: { paletteGroup: "Examples" },
  }),
  // No `workspace`, so not offered in the palette.
  remoteModule("admin", "Admin"),
];

const registry: PortalModuleRegistry = { modules: remoteModules };

/**
 * The showcase has no Module Federation remotes, so modules are rendered
 * locally instead of with RemoteModule.
 */
const renderModule: PortalModuleRenderer = (module) => (
  <div style={{ padding: 12 }}>
    <h3 style={{ margin: 0 }}>{module.title}</h3>
    <p>{module.description}</p>
  </div>
);

const { renderers, settingsCodecs } = createPortalComponentRegistries({
  onChangeServer: ({ setServerId }) => setServerId(SERVER_ID),
  renderModule,
});

const marketsLayout = {
  components: [
    {
      id: "component-instruments",
      settings: { module: "SIMUL", serverId: SERVER_ID, table: "instruments" },
      type: "vuu-table",
      version: 1,
    },
    {
      id: "component-chart",
      settings: { moduleId: "price-chart" },
      type: "portal-module",
      version: 1,
    },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["2fr", "1fr"],
    id: "markets-layout",
    items: [
      {
        column: { span: 1, start: 1 },
        componentInstanceId: "component-instruments",
        dropTarget: true,
        header: true,
        id: "markets-instruments",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "instruments",
      },
      {
        column: { span: 1, start: 2 },
        componentInstanceId: "component-chart",
        dropTarget: true,
        header: true,
        id: "markets-chart",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Price chart",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
} as unknown as GridLayoutDocument;

const marketsWorkspace: NamedWorkspaceDefinitionV1 = {
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "markets",
  name: "Markets",
  snapshot: { componentState: {}, layout: marketsLayout, version: 1 },
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
};

const workspaces: PortalWorkspacesOptions = {
  componentRenderers: renderers,
  headerActions: <AddPanelButton />,
  settingsCodecs,
  systemWorkspaces: [marketsWorkspace],
};

/**
 * Workspaces with the Panels palette. Open Markets, or "+ New workspace",
 * then use Add panel, which opens the palette in the shell's context panel.
 * It stays open as you switch workspaces. Drag a module or table onto the workspace, press + to
 * add it, or click it: with one panel a click replaces it, with several you
 * choose to replace the focused panel (R) or open a new tab (T).
 */
export const WorkspacesWithPanelsPalette = () => (
  <AuthenticationProvider
    localServers={localServers}
    mode="local"
    registry={registry}
  >
    <PortalShell
      header={false}
      id="panels-palette-demo"
      remoteModules={remoteModules}
      serverMonitor={false}
      title="Panels palette"
      workspaces={workspaces}
    >
      <PortalNav remoteModules={remoteModules} sections="collapsible" />
      <PortalLandingPage>
        <main style={{ padding: 24 }}>
          <h1>Panels palette</h1>
          <p>
            Open a workspace from the nav, or create one with + New workspace,
            then press Add panel in the workspace header.
          </p>
        </main>
      </PortalLandingPage>
    </PortalShell>
  </AuthenticationProvider>
);
