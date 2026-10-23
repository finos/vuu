import { HelpIcon } from "@salt-ds/icons";
import { AuthenticationProvider } from "@vuu-ui/core";
import {
  type PortalConnectionDescriptor,
  PortalConnectionStatus,
  type PortalNavFooterVariant,
  PortalNavUserMenu,
  PortalNavUserMenuItem,
  PortalPersistenceProvider,
  type PortalPersistenceService,
  type PortalSaveStatus,
  SavedStateContext,
  type SavedStateContextValue,
  VuuServerMonitorProvider,
  type VuuServerPresence,
  type VuuServerStatus,
  type VuuServerStatusSource,
} from "@vuu-ui/core/portal";
import { type ReactNode, useMemo } from "react";

type Scenario = "all-healthy" | "trading-reconnecting" | "portal-offline";

const connections: PortalConnectionDescriptor[] = [
  {
    connectionId: "portal",
    label: "Portal",
    impact: "Applications can't be opened and saved state isn't written.",
  },
  {
    connectionId: "trading",
    label: "Trading",
    impact: "Prices and order updates are paused.",
    detail: "Session: continuous trading",
  },
];

const status = (
  connectionId: string,
  presence: VuuServerPresence,
  detail?: VuuServerStatus["detail"],
): VuuServerStatus => ({
  connectionId,
  detail,
  monitored: true,
  presence,
  since: Date.now(),
});

const scenarioStatuses = (scenario: Scenario): VuuServerStatus[] => {
  const now = Date.now();
  switch (scenario) {
    case "trading-reconnecting":
      return [
        status("portal", "online", {
          endpoint: "portal.example.com",
          reason: "",
        }),
        status("trading", "degraded", {
          endpoint: "trading.example.com:8443",
          lastOnlineAt: now - 20_000,
          nextAttemptAt: now + 12_000,
          reason: "Connection lost",
          reconnecting: true,
        }),
      ];
    case "portal-offline":
      return [
        status("portal", "offline", {
          endpoint: "portal.example.com",
          lastOnlineAt: now - 180_000,
          nextAttemptAt: now + 45_000,
          reason: "Server not responding",
        }),
        status("trading", "online", {
          endpoint: "trading.example.com:8443",
          reason: "",
        }),
      ];
    default:
      return [
        status("portal", "online", {
          endpoint: "portal.example.com",
          reason: "",
        }),
        status("trading", "online", {
          endpoint: "trading.example.com:8443",
          reason: "",
        }),
      ];
  }
};

/** A server monitor with fixed statuses. Retry brings a connection online. */
class ScenarioServerMonitor implements VuuServerStatusSource {
  #listeners = new Set<() => void>();
  #statuses: Map<string, VuuServerStatus>;

  constructor(scenario: Scenario) {
    this.#statuses = new Map(
      scenarioStatuses(scenario).map((s) => [s.connectionId, s]),
    );
  }
  getStatus = (connectionId: string) =>
    this.#statuses.get(connectionId) ?? status(connectionId, "unknown");
  getModuleStatus = (moduleId: string) => this.getStatus(moduleId);
  getStatuses = () => this.#statuses;
  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };
  retry = (connectionId: string) => {
    const current = this.getStatus(connectionId);
    this.#update({
      ...current,
      detail: { ...current.detail, checking: true, reason: "Reconnecting" },
    });
    setTimeout(() => {
      this.#update(
        status(connectionId, "online", {
          endpoint: current.detail?.endpoint,
          reason: "",
        }),
      );
    }, 1500);
  };
  retryModule = (moduleId: string) => this.retry(moduleId);
  setDisplayOrder = () => undefined;
  setOpenModule = () => undefined;
  setVisibleModules = () => undefined;
  start = () => undefined;
  stop = () => undefined;

  #update(next: VuuServerStatus) {
    this.#statuses = new Map(this.#statuses).set(next.connectionId, next);
    for (const listener of this.#listeners) listener();
  }
}

/** Just enough of the persistence service for the save-status line. */
const fakePersistence = (saveStatus: PortalSaveStatus) =>
  ({
    dispose: () => undefined,
    flushAll: async () => undefined,
    getSaveStatus: () => saveStatus,
    isDisposed: () => false,
    subscribeSaveStatus: () => () => undefined,
  }) as unknown as PortalPersistenceService;

const savedState: SavedStateContextValue = {
  applicationKeyForModule: () => undefined,
  notify: () => undefined,
  open: () => alert("Saved state dialog"),
  reportCarryForward: () => undefined,
};

const user = {
  email: "jane.doe@example.com",
  firstName: "Jane",
  lastName: "Doe",
  userName: "jdoe",
};
const authorizations = ["trader", "risk-viewer"];

const NavFooterFrame = ({
  children,
  scenario,
  saveStatus,
}: {
  children: ReactNode;
  scenario: Scenario;
  saveStatus: PortalSaveStatus;
}) => {
  const monitor = useMemo(
    () => new ScenarioServerMonitor(scenario),
    [scenario],
  );
  const persistence = useMemo(() => fakePersistence(saveStatus), [saveStatus]);
  return (
    <AuthenticationProvider
      authorizations={authorizations}
      mode="local"
      user={user}
    >
      <VuuServerMonitorProvider monitor={monitor}>
        <PortalPersistenceProvider service={persistence}>
          <SavedStateContext.Provider value={savedState}>
            {children}
          </SavedStateContext.Provider>
        </PortalPersistenceProvider>
      </VuuServerMonitorProvider>
    </AuthenticationProvider>
  );
};

const MockNavFooter = ({ variant }: { variant: PortalNavFooterVariant }) => (
  <nav
    aria-label={`Nav (${variant})`}
    style={{
      background: "var(--salt-container-secondary-background)",
      borderRight:
        "var(--salt-size-border) solid var(--salt-separable-primary-borderColor)",
      display: "flex",
      flexDirection: "column",
      height: 420,
      overflow: "hidden",
      width: variant === "rail" ? 60 : 248,
    }}
  >
    <div style={{ flex: 1 }} />
    <div
      style={{
        alignItems: variant === "rail" ? "center" : "stretch",
        borderTop:
          "var(--salt-size-border) solid var(--salt-separable-primary-borderColor)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--salt-spacing-50)",
        padding: "var(--salt-spacing-100)",
      }}
    >
      <PortalConnectionStatus connections={connections} variant={variant} />
      <PortalNavUserMenu account="Account: EQ-LDN-01" variant={variant}>
        <PortalNavUserMenuItem
          icon={<HelpIcon />}
          onClick={() => alert("Help")}
        >
          Help
        </PortalNavUserMenuItem>
      </PortalNavUserMenu>
    </div>
  </nav>
);

const NavFooterPair = ({
  scenario,
  saveStatus,
}: {
  scenario: Scenario;
  saveStatus: PortalSaveStatus;
}) => (
  <NavFooterFrame saveStatus={saveStatus} scenario={scenario}>
    <div style={{ display: "flex", gap: 48, padding: 24 }}>
      <MockNavFooter variant="expanded" />
      <MockNavFooter variant="rail" />
    </div>
  </NavFooterFrame>
);

const savedTwoMinutesAgo = (): PortalSaveStatus => ({
  lastSavedAt: Date.now() - 2 * 60_000,
  saving: false,
});

export const NavFooterAllHealthy = () => {
  const saveStatus = useMemo(savedTwoMinutesAgo, []);
  return <NavFooterPair saveStatus={saveStatus} scenario="all-healthy" />;
};

export const NavFooterTradingReconnecting = () => {
  const saveStatus = useMemo(() => ({ saving: true }), []);
  return (
    <NavFooterPair saveStatus={saveStatus} scenario="trading-reconnecting" />
  );
};

export const NavFooterPortalOffline = () => {
  const saveStatus = useMemo(savedTwoMinutesAgo, []);
  return <NavFooterPair saveStatus={saveStatus} scenario="portal-offline" />;
};
