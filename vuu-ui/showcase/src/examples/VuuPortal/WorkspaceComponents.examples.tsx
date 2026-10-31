import {
  AuthenticationProvider,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import {
  createPortalComponentRegistries,
  PortalDragSourceScope,
  type PortalModuleRenderer,
  portalModuleTemplate,
  type RemoteModuleDescriptor,
  usePaletteModules,
  usePortalDragSource,
  vuuTableTemplate,
} from "@vuu-ui/core/portal";
import { createLocalVuuServer, simulModule } from "@vuu-ui/vuu-data-test";
import {
  GridLayout,
  type GridLayoutDocument,
  GridLayoutProvider,
  type TypedComponentTemplate,
} from "@heswell/grid-layout";
import { useMemo, useState } from "react";
import { ordersIcon, positionsIcon } from "./portal-icons";

const SERVER_ID = "simul";

const localServers = [
  createLocalVuuServer({ connectionId: SERVER_ID, modules: [simulModule] }),
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
  navLocation: `/Trading/${title}`,
  path: `/${name}`,
  title,
  version: 1,
  ...overrides,
});

const moduleRegistry: PortalModuleRegistry = {
  modules: [
    remoteModule("orders", "Orders", {
      navIconUrl: ordersIcon,
      workspace: { defaultSize: { cols: 2 }, paletteGroup: "Trading" },
    }),
    remoteModule("positions", "Positions", {
      navIconUrl: positionsIcon,
      workspace: { paletteGroup: "Trading" },
    }),
    // No `workspace`, so not offered in the palette.
    remoteModule("admin", "Admin"),
  ],
};

const tableTemplates = ["instruments", "prices", "orders"].map((table) =>
  vuuTableTemplate({ module: "SIMUL", serverId: SERVER_ID, table }),
);

/**
 * The showcase has no Module Federation remotes, so modules are rendered
 * locally instead of with RemoteModule.
 */
const renderModule: PortalModuleRenderer = (module, props) => (
  <div style={{ padding: 12 }}>
    <h3 style={{ margin: 0 }}>{module.title}</h3>
    <p>
      Module <code>{module.name}</code>, rendered from the{" "}
      <code>portal-module</code> component type.
    </p>
    {props ? <pre>{JSON.stringify(props, null, 2)}</pre> : null}
  </div>
);

const initialDocument = {
  components: [
    {
      id: "component-instruments",
      settings: { module: "SIMUL", serverId: SERVER_ID, table: "instruments" },
      type: "vuu-table",
      version: 1,
    },
  ],
  kind: "grid-layout",
  layout: {
    columns: ["1fr", "1fr"],
    id: "workspace",
    items: [
      {
        column: { span: 2, start: 1 },
        componentInstanceId: "component-instruments",
        dropTarget: true,
        header: true,
        id: "instruments",
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title: "Instruments",
      },
    ],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
} as unknown as GridLayoutDocument;

const PaletteItem = ({
  iconUrl,
  template,
}: {
  iconUrl?: string;
  template: TypedComponentTemplate;
}) => {
  const dragSource = usePortalDragSource(template);
  return (
    <div
      {...dragSource}
      style={{
        alignItems: "center",
        border: "1px solid var(--salt-separable-primary-borderColor)",
        cursor: "grab",
        display: "flex",
        gap: 6,
        padding: "4px 8px",
      }}
    >
      {iconUrl ? <img alt="" height={16} src={iconUrl} width={16} /> : null}
      {template.label}
    </div>
  );
};

const Palette = () => {
  const moduleGroups = usePaletteModules();
  return (
    <PortalDragSourceScope>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: 8,
          width: 200,
        }}
      >
        {moduleGroups.map(({ modules, paletteGroup }) => (
          <section key={paletteGroup}>
            <h4 style={{ margin: "4px 0" }}>{paletteGroup}</h4>
            {modules.map(({ descriptor, iconUrl, template }) => (
              <PaletteItem
                iconUrl={iconUrl}
                key={descriptor.id}
                template={template}
              />
            ))}
          </section>
        ))}
        <section>
          <h4 style={{ margin: "4px 0" }}>Tables ({SERVER_ID})</h4>
          {tableTemplates.map((template) => (
            <PaletteItem key={template.label} template={template} />
          ))}
        </section>
        <section>
          <h4 style={{ margin: "4px 0" }}>Unavailable</h4>
          <PaletteItem
            template={portalModuleTemplate({ id: "missing", title: "Missing" })}
          />
          <PaletteItem
            template={vuuTableTemplate({
              module: "SIMUL",
              serverId: "offline",
              table: "prices",
            })}
          />
        </section>
      </div>
    </PortalDragSourceScope>
  );
};

/**
 * Drag `portal-module` and `vuu-table` templates from the palette into the
 * workspace. The document, with each item's settings, is shown below.
 */
export const DragWorkspaceComponents = () => {
  const [document, setDocument] = useState(initialDocument);
  const { renderers, settingsCodecs } = useMemo(
    () =>
      createPortalComponentRegistries({
        onChangeServer: ({ setServerId }) => setServerId(SERVER_ID),
        renderModule,
      }),
    [],
  );

  return (
    <AuthenticationProvider
      localServers={localServers}
      mode="local"
      registry={moduleRegistry}
    >
      <GridLayoutProvider
        componentRenderers={renderers}
        document={initialDocument}
        onDocumentChange={setDocument}
        settingsCodecs={settingsCodecs}
      >
        <div style={{ display: "flex", height: "100%" }}>
          <Palette />
          <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
            <GridLayout id="workspace" style={{ flex: 1 }} />
            <pre
              style={{
                fontSize: 11,
                height: 160,
                margin: 0,
                overflow: "auto",
              }}
            >
              {JSON.stringify(document.components, null, 2)}
            </pre>
          </div>
        </div>
      </GridLayoutProvider>
    </AuthenticationProvider>
  );
};
