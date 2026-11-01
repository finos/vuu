import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
} from "@vuu-ui/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { ContextPanelProvider } from "@vuu-ui/vuu-ui-controls";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  UserPersistenceScope,
  WorkspacePersistenceService,
} from "../../src/persistence-manager";
import {
  WorkspaceProvider,
  useWorkspace,
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type WorkspaceContextValue,
  type WorkspaceSnapshotRecordV1,
} from "../../src/workspace-management";
import { LeftNav } from "../../src/left-nav";
import { AppHeader } from "../../src/app-header";
import { ApplicationSettingsContextPanel } from "../../src/shell-layout-templates/context-panel";

vi.mock("@vuu-ui/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vuu-ui/core")>()),
  useLogout: () => vi.fn(),
}));

class MemoryService implements WorkspacePersistenceService {
  readonly definitions = new Map<string, NamedWorkspaceDefinitionV1>();
  readonly scope: UserPersistenceScope;
  readonly snapshots = new Map<string, WorkspaceSnapshotRecordV1>();
  session: ApplicationSessionV1 | undefined;

  constructor(
    userId = "alice",
    definitions: NamedWorkspaceDefinitionV1[] = [],
  ) {
    this.scope = {
      applicationId: "test",
      applicationNamespace: "finos",
      userId,
    };
    definitions.forEach((item) => {
      this.definitions.set(item.id, item);
    });
  }

  loadApplicationSession = async () => this.session;
  saveApplicationSession = async (session: ApplicationSessionV1) => {
    this.session = session;
  };
  deleteApplicationSession = async () => {
    this.session = undefined;
  };
  listWorkspaceSnapshots = async () => [...this.snapshots.values()];
  loadWorkspaceSnapshot = async (id: string) => this.snapshots.get(id);
  saveWorkspaceSnapshot = async (record: WorkspaceSnapshotRecordV1) => {
    this.snapshots.set(record.workspaceInstanceId, record);
  };
  deleteWorkspaceSnapshot = async (id: string) => {
    this.snapshots.delete(id);
  };
  listNamedWorkspaceMetadata = async (): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > =>
    [...this.definitions.values()].map(
      ({ createdAt, description, id, name, updatedAt, version }) => ({
        createdAt,
        ...(description === undefined ? {} : { description }),
        id,
        name,
        updatedAt,
        version,
      }),
    );
  loadNamedWorkspaceDefinition = async (id: string) => this.definitions.get(id);
  saveNamedWorkspaceDefinition = async (value: NamedWorkspaceDefinitionV1) => {
    this.definitions.set(value.id, value);
  };
  deleteNamedWorkspaceDefinition = async (id: string) => {
    this.definitions.delete(id);
  };
}

const renderers = new GridComponentRendererRegistry();
const codecs = new GridComponentSettingsRegistry();
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, reject, resolve };
};
let latest: WorkspaceContextValue | undefined;
const Capture = () => {
  latest = useWorkspace();
  return null;
};

describe("workspace runtime", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    latest = undefined;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("hydrates navigation after session load and hides old-scope state during a switch", async () => {
    const first = new MemoryService("alice");
    const firstSession = deferred<ApplicationSessionV1 | undefined>();
    first.loadApplicationSession = () => firstSession.promise;
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={first}
            settingsCodecs={codecs}
            userId="alice"
          >
            <Capture />
            <LeftNav defaultActiveTabIndex={0} defaultExpanded />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    expect(container.querySelector(".vuuLeftNav-menu-full")).not.toBeNull();

    await act(async () => {
      firstSession.resolve({
        activeWorkspaceInstanceId: null,
        openWorkspaces: [],
        settings: {
          "leftNav.activeTabIndex": 3,
          "leftNav.expanded": false,
        },
        version: 1,
        workspaceOrder: [],
      });
    });
    await vi.waitFor(() =>
      expect(
        container.querySelector(".vuuLeftNav-menu-icons-content"),
      ).not.toBeNull(),
    );

    const second = new MemoryService("bob");
    const secondSession = deferred<ApplicationSessionV1 | undefined>();
    second.loadApplicationSession = () => secondSession.promise;
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={second}
            settingsCodecs={codecs}
            userId="bob"
          >
            <Capture />
            <LeftNav defaultActiveTabIndex={0} defaultExpanded />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    expect(container.querySelector(".vuuLeftNav-menu-full")).not.toBeNull();
    expect(
      container.querySelector(".vuuLeftNav-menu-icons-content"),
    ).toBeNull();

    await act(async () => secondSession.resolve(undefined));
  });

  it("opens the application settings panel and resets through the controller", async () => {
    const service = new MemoryService("alice");
    service.session = {
      activeWorkspaceInstanceId: null,
      openWorkspaces: [],
      settings: {},
      version: 1,
      workspaceOrder: [],
    };
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={service}
            settingsCodecs={codecs}
            userId="alice"
          >
            <ContextPanelProvider showContextPanel={() => undefined}>
              <Capture />
              <AppHeader />
              <ApplicationSettingsContextPanel />
            </ContextPanelProvider>
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    await vi.waitFor(() => expect(latest?.status).toBe("empty"));
    const buttons = [...container.querySelectorAll("button")];
    const settings = buttons.find((button) =>
      button.textContent?.includes("Settings"),
    );
    const reset = buttons.find((button) =>
      button.textContent?.includes("Reset"),
    );
    if (!settings || !reset) {
      throw new Error("Expected AppHeader controls");
    }

    await act(async () => settings.click());
    await vi.waitFor(() =>
      expect(
        container.querySelector(".vuuContextPanel-expanded"),
      ).not.toBeNull(),
    );
    expect(service.session?.settings).toEqual({
      "applicationSettings.panelOpen": true,
    });

    await act(async () => reset.click());
    await vi.waitFor(() => expect(service.session).toBeUndefined());
    expect(latest?.settings).toEqual({});
    expect(container.querySelector(".vuuContextPanel-expanded")).toBeNull();
  });
});
