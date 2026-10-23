import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import {
  AuthenticationProvider,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import {
  type PortalNavDensity,
  type PortalNavDisplayMode,
  type PortalNavItem,
  type PortalNavProps,
  type PortalNavSectionStyle,
  type PortalNavSlotContext,
  type NotificationLevel,
  matchTopicModules,
  NotificationsIndicator,
  PortalLandingPage,
  PortalNav,
  PortalShell,
  type RemoteModuleDescriptor,
  usePortalNotifications,
  VuuServerMonitorProvider,
  type VuuServerMonitorProviderProps,
  type VuuServerStatus,
} from "@vuu-ui/core/portal";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import {
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  chartIcon,
  deskOverviewIcon,
  depthChartIcon,
  executionQualityIcon,
  executionsIcon,
  exposureIcon,
  marketDepthIcon,
  ordersIcon,
  pnlIcon,
  positionsIcon,
  priceLadderIcon,
  timeAndSalesIcon,
  watchlistIcon,
  workspaceIcon,
} from "./portal-nav-icons";

let navOrder = 0;
const navModule = (
  navLocation: string,
  navIconUrl: string,
  extra: Partial<RemoteModuleDescriptor> = {},
): RemoteModuleDescriptor => {
  const [, title = ""] = navLocation.split("/").filter(Boolean);
  const name = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return {
    accessRole: `${name}-access`,
    clientIdentifier: `vuu-${name}`,
    description: title,
    id: name,
    mfComponent: title,
    mfScope: name,
    mfUrl: `http://localhost:5001/${name}/mf-manifest.json`,
    name,
    navIconUrl,
    navLocation,
    navOrder: navOrder++,
    path: `/${name}`,
    title,
    version: 1,
    ...extra,
  };
};

/** The information architecture of the PortalNav design. */
const registry = {
  modules: [
    navModule("/Workspaces/Trader", workspaceIcon, {
      notificationTopics: ["orders", "fills", "marketdata", "risk"],
    }),
    navModule("/Trading/Watchlist", watchlistIcon),
    navModule("/Trading/Orders", ordersIcon, {
      navBadge: "workingOrders",
      notificationTopics: ["orders"],
    }),
    navModule("/Trading/Executions", executionsIcon, {
      navBadge: "executions",
      notificationTopics: ["fills"],
    }),
    navModule("/Trading/Price ladder", priceLadderIcon),
    navModule("/Market/Market depth", marketDepthIcon),
    navModule("/Market/Time & sales", timeAndSalesIcon),
    navModule("/Market/Chart", chartIcon),
    navModule("/Market/Depth chart", depthChartIcon),
    navModule("/Portfolio/Positions", positionsIcon, {
      navBadge: "dayPnl",
      notificationTopics: ["positions", "risk"],
    }),
    navModule("/Portfolio/P&L", pnlIcon),
    navModule("/Portfolio/Exposure", exposureIcon, {
      notificationTopics: ["risk"],
    }),
    navModule("/Portfolio/Execution quality", executionQualityIcon),
    navModule("/Oversight/Desk overview", deskOverviewIcon, {
      notificationTopics: ["risk", "orders"],
    }),
  ],
} satisfies PortalModuleRegistry;

const remoteModules = registry.modules;
const deskOverviewId =
  remoteModules.find(({ title }) => title === "Desk overview")?.id ?? "";

/** Simulated live values, keyed by `navBadge`. */
const useLiveBadges = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);
  const pnl = 18.4 + Math.sin(tick / 3) * 4;
  return {
    dayPnl: (
      <span
        style={{
          color:
            pnl >= 0
              ? "var(--salt-status-success-foreground-decorative)"
              : "var(--salt-status-error-foreground-decorative)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pnl >= 0 ? "+" : "−"}
        {Math.abs(pnl).toFixed(1)}k
      </span>
    ),
    executions: 48 + tick,
    workingOrders: 12 + (tick % 4),
  } as Record<string, ReactNode>;
};

/**
 * Logo, name and environment, then the bell for notifications no nav entry
 * claims. In the rail: the logo (click to expand), with the bell below.
 */
const Brand = ({ displayMode, setDisplayMode }: PortalNavSlotContext) => (
  <>
    {displayMode === "icons" ? (
      <button
        aria-label="Vuu Trader: show full navigation"
        onClick={() => setDisplayMode("icons-and-text")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          padding: 0,
        }}
        title="Show full navigation"
        type="button"
      >
        <VuuLogo size={28} />
      </button>
    ) : (
      <VuuLogo size={28} />
    )}
    {displayMode === "icons" ? null : (
      <>
        <span style={{ fontSize: 14, fontWeight: 650 }}>Vuu Trader</span>
        <span
          style={{
            border: "1px solid var(--salt-separable-tertiary-borderColor)",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 650,
            letterSpacing: "0.06em",
            padding: "2px 6px",
          }}
        >
          SIM
        </span>
      </>
    )}
    <NotificationsIndicator compactStyle="bell" scope="unclaimed" />
  </>
);

let notificationId = 0;
/** Publishes an unread notification for a random module. */
const SimulateNotification = ({ compact }: { compact: boolean }) => {
  const notifications = usePortalNotifications();
  const onClick = () => {
    const id = String(notificationId++);
    const module = remoteModules[Number(id) % remoteModules.length];
    const now = Date.now();
    notifications?.store.upsert({
      attributes: {},
      createdAt: now,
      expired: false,
      id,
      initial: false,
      key: `showcase:${id}`,
      kind: "silent",
      level: "info",
      message: `A notification for ${module.title}`,
      origin: { moduleIds: [module.id], source: "client" },
      read: false,
      receivedAt: now,
      title: module.title,
    });
  };
  return (
    <Button
      aria-label="Simulate a notification"
      onClick={onClick}
      sentiment="neutral"
      appearance="bordered"
    >
      {compact ? "+" : "Simulate notification"}
    </Button>
  );
};

/** Server notifications the simulator might publish, routed by topic. */
const TOPIC_NOTIFICATIONS: {
  label: string;
  level: NotificationLevel;
  message: string;
  short: string;
  title: string;
  topic: string;
}[] = [
  {
    label: "Order rejected",
    level: "error",
    message: "ORD-1042 rejected: price outside band",
    short: "E",
    title: "Order rejected",
    topic: "orders",
  },
  {
    label: "Risk warning",
    level: "warning",
    message: "Desk delta at 92% of limit",
    short: "W",
    title: "Risk limit warning",
    topic: "risk",
  },
  {
    label: "Unclaimed info",
    level: "info",
    message: "Compliance attestation due Friday",
    short: "I",
    title: "Compliance reminder",
    topic: "compliance",
  },
];

/**
 * Publishes a server notification with a topic, attributed as the portal
 * attributes notifications from a server all modules use.
 */
const TopicNotifications = ({ compact }: { compact: boolean }) => {
  const notifications = usePortalNotifications();
  const publish = ({
    level,
    message,
    title,
    topic,
  }: (typeof TOPIC_NOTIFICATIONS)[number]) => {
    const id = `topic-${notificationId++}`;
    const now = Date.now();
    const moduleIds =
      matchTopicModules({ topic }, remoteModules) ??
      remoteModules.map(({ id }) => id);
    notifications?.store.upsert({
      attributes: {},
      createdAt: now,
      expired: false,
      id,
      initial: false,
      key: `showcase:${id}`,
      kind: "silent",
      level,
      message,
      origin: { connectionId: "showcase", moduleIds, source: "server" },
      read: false,
      receivedAt: now,
      title,
      topic,
    });
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        flexWrap: "wrap",
        gap: 4,
      }}
    >
      {TOPIC_NOTIFICATIONS.map((notification) => (
        <Button
          appearance="bordered"
          aria-label={`Publish ${notification.label.toLowerCase()} (${notification.topic})`}
          key={notification.topic}
          onClick={() => publish(notification)}
          sentiment="neutral"
          title={`${notification.title} · topic ${notification.topic}`}
        >
          {compact ? notification.short : notification.label}
        </Button>
      ))}
    </div>
  );
};

/** Stands in for UI-4's PortalConnectionStatus and PortalUserMenu. */
const PlaceholderFooter = ({ displayMode }: PortalNavSlotContext) => {
  const rail = displayMode === "icons";
  return (
    <>
      <TopicNotifications compact={rail} />
      <SimulateNotification compact={rail} />
      <div
        style={{
          alignItems: "center",
          color: "var(--salt-content-secondary-foreground)",
          display: "flex",
          fontSize: 11.5,
          gap: 8,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            background: "var(--salt-status-success-foreground-decorative)",
            borderRadius: "50%",
            flex: "none",
            height: 7,
            width: 7,
          }}
        />
        {rail ? null : "Connected · placeholder footer"}
      </div>
    </>
  );
};

type ServerMonitor = NonNullable<VuuServerMonitorProviderProps["monitor"]>;
type ModuleId = RemoteModuleDescriptor["id"];

/**
 * The showcase has no module servers, so module configs fail to load. This
 * stands in for the server monitor: every module is online except
 * `unavailable` ones, which come back online on Retry.
 */
const createShowcaseMonitor = (unavailable: ModuleId[] = []): ServerMonitor => {
  const since = Date.now();
  const down = new Set(unavailable);
  const listeners = new Set<() => void>();
  const online: VuuServerStatus = {
    connectionId: "showcase",
    monitored: true,
    presence: "online",
    since,
  };
  const statuses = new Map<ModuleId, VuuServerStatus>(
    unavailable.map((moduleId) => [
      moduleId,
      {
        connectionId: "",
        detail: { reason: "Configuration could not be loaded" },
        monitored: false,
        presence: "unavailable",
        since,
      },
    ]),
  );
  return {
    getModuleStatus: (moduleId) =>
      (down.has(moduleId) && statuses.get(moduleId)) || online,
    getStatus: () => online,
    getStatuses: () => new Map([["showcase", online]]),
    retry: () => undefined,
    retryModule: (moduleId) => {
      down.delete(moduleId);
      for (const listener of listeners) {
        listener();
      }
    },
    setDisplayOrder: () => undefined,
    setOpenModule: () => undefined,
    setVisibleModules: () => undefined,
    start: () => undefined,
    stop: () => undefined,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const NavShell = ({
  children,
  renderBadge: renderBadgeProp,
  unavailableModules,
  ...navProps
}: Partial<PortalNavProps> & {
  children?: ReactNode;
  unavailableModules?: ModuleId[];
}) => {
  const badges = useLiveBadges();
  const unavailableKey = unavailableModules?.join();
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on unavailableKey
  const monitor = useMemo(
    () => createShowcaseMonitor(unavailableModules),
    [unavailableKey],
  );
  const renderBadge =
    renderBadgeProp ??
    ((item: PortalNavItem) =>
      item.navBadge ? badges[item.navBadge] : undefined);
  return (
    <AuthenticationProvider mode="local" registry={registry}>
      <PortalShell
        header={false}
        id="portal-nav-demo"
        remoteModules={remoteModules}
        serverMonitor={false}
        title="PortalNav Demo"
      >
        <VuuServerMonitorProvider monitor={monitor}>
          <PortalNav
            brand={Brand}
            footer={PlaceholderFooter}
            remoteModules={remoteModules}
            renderBadge={renderBadge}
            {...navProps}
          />
        </VuuServerMonitorProvider>
        {/* PortalShell recognises a direct PortalLandingPage child. */}
        <PortalLandingPage>
          <main style={{ padding: 24 }}>
            <h1>PortalNav</h1>
            <p>
              ⌘B / Ctrl+B toggles the nav. Selecting an application loads its
              (unavailable) remote module.
            </p>
            <p>
              The footer buttons publish server notifications by topic: an order
              rejection (<code>orders</code>: Trader, Orders, Desk overview), a
              risk warning (<code>risk</code>: Trader, Positions, Exposure, Desk
              overview) and an info no entry claims, which only the bell counts.
              Notifications for the open page are read everywhere.
            </p>
            {children}
          </main>
        </PortalLandingPage>
      </PortalShell>
    </AuthenticationProvider>
  );
};

/** Controlled, so each story opens in its own mode. */
const ModeStory = ({
  displayMode: initialMode,
  ...props
}: Partial<PortalNavProps> & { displayMode: PortalNavDisplayMode }) => {
  const [displayMode, setDisplayMode] = useState(initialMode);
  return (
    <NavShell
      {...props}
      displayMode={displayMode}
      onDisplayModeChange={setDisplayMode}
    >
      <ToggleButtonGroup
        onChange={(e: SyntheticEvent<HTMLButtonElement>) =>
          setDisplayMode(e.currentTarget.value as PortalNavDisplayMode)
        }
        value={displayMode}
      >
        <ToggleButton value="icons-and-text">Icons and text</ToggleButton>
        <ToggleButton value="text">Text</ToggleButton>
        <ToggleButton value="icons">Icons</ToggleButton>
        <ToggleButton value="minimized">Minimized</ToggleButton>
      </ToggleButtonGroup>
    </NavShell>
  );
};

export const IconsAndText = () => <ModeStory displayMode="icons-and-text" />;

export const TextOnly = () => <ModeStory displayMode="text" />;

export const IconsRail = () => <ModeStory displayMode="icons" />;

export const Minimized = () => (
  <ModeStory collapseTo="minimized" displayMode="minimized" />
);

export const CompactDensity = () => (
  <ModeStory density="compact" displayMode="icons-and-text" />
);

export const CollapsibleSections = () => (
  <ModeStory displayMode="icons-and-text" sections="collapsible" />
);

export const NoSections = () => (
  <ModeStory displayMode="icons-and-text" sections="none" />
);

/**
 * Uncontrolled: the mode is saved in the portal's saved state
 * (`nav/displayMode`), auto collapses to the rail below 900px, and is
 * restored on reload.
 */
export const PersistedDisplayMode = () => (
  <NavShell autoCollapseBelow={900} sections="collapsible" />
);

/** Every option, chosen at runtime. */
export const Playground = () => {
  const [displayMode, setDisplayMode] =
    useState<PortalNavDisplayMode>("icons-and-text");
  const [density, setDensity] = useState<PortalNavDensity>("comfortable");
  const [sections, setSections] = useState<PortalNavSectionStyle>("headings");
  const [collapseTo, setCollapseTo] = useState<"icons" | "minimized">("icons");
  const [badges, setBadges] = useState(true);
  return (
    <NavShell
      collapseTo={collapseTo}
      density={density}
      displayMode={displayMode}
      onDisplayModeChange={setDisplayMode}
      renderBadge={badges ? undefined : () => null}
      sections={sections}
      unavailableModules={[deskOverviewId]}
    >
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <ToggleButtonGroup
          onChange={(e: SyntheticEvent<HTMLButtonElement>) =>
            setDisplayMode(e.currentTarget.value as PortalNavDisplayMode)
          }
          value={displayMode}
        >
          <ToggleButton value="icons-and-text">Icons and text</ToggleButton>
          <ToggleButton value="text">Text</ToggleButton>
          <ToggleButton value="icons">Icons</ToggleButton>
          <ToggleButton value="minimized">Minimized</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          onChange={(e: SyntheticEvent<HTMLButtonElement>) =>
            setDensity(e.currentTarget.value as PortalNavDensity)
          }
          value={density}
        >
          <ToggleButton value="comfortable">Comfortable</ToggleButton>
          <ToggleButton value="compact">Compact</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          onChange={(e: SyntheticEvent<HTMLButtonElement>) =>
            setSections(e.currentTarget.value as PortalNavSectionStyle)
          }
          value={sections}
        >
          <ToggleButton value="headings">Headings</ToggleButton>
          <ToggleButton value="collapsible">Collapsible</ToggleButton>
          <ToggleButton value="none">None</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          onChange={(e: SyntheticEvent<HTMLButtonElement>) =>
            setCollapseTo(e.currentTarget.value as "icons" | "minimized")
          }
          value={collapseTo}
        >
          <ToggleButton value="icons">Collapse to icons</ToggleButton>
          <ToggleButton value="minimized">Collapse to minimized</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButton
          onChange={() => setBadges((b) => !b)}
          selected={badges}
          value="badges"
        >
          Live badges
        </ToggleButton>
      </div>
    </NavShell>
  );
};
