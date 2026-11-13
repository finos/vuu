import { Button } from "@salt-ds/core";
import {
  AuthenticationProvider,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import {
  type NotificationLevel,
  type PortalNotification,
  PortalLandingPage,
  PortalShell,
  type RemoteModuleDescriptor,
  useNotificationPresentation,
  usePortalNotifications,
} from "@vuu-ui/core/portal";
import { useEffect } from "react";

const module = (title: string): RemoteModuleDescriptor => {
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
    navLocation: `/Apps/${title}`,
    path: `/${name}`,
    title,
    version: 1,
  };
};

const registry = {
  modules: [module("Order Management"), module("Basket Trading")],
} satisfies PortalModuleRegistry;

const MINUTE = 60_000;

interface Seed {
  attributes?: Record<string, string>;
  /** Server the notification came from; none for a client notification. */
  connectionId?: string;
  expired?: boolean;
  kind?: PortalNotification["kind"];
  level: NotificationLevel;
  message: string;
  minutesAgo: number;
  module?: string;
  read?: boolean;
  title: string;
}

/** Shaped like the Vuu server simulator's notifications. */
const SEEDS: Seed[] = [
  {
    attributes: { priority: "10", source: "OMS" },
    connectionId: "vuu-emea",
    level: "error",
    message: "Order #4821 rejected by exchange: Insufficient margin",
    minutesAgo: 1,
    module: "order-management",
    title: "Order Rejection",
  },
  {
    attributes: { priority: "5", source: "SYSTEM" },
    connectionId: "vuu-emea",
    kind: "banner",
    level: "warning",
    message: "Scheduled system maintenance will begin in 15 minutes",
    minutesAgo: 4,
    title: "System Maintenance",
  },
  {
    attributes: { priority: "5", source: "RISK" },
    connectionId: "vuu-emea",
    expired: true,
    level: "warning",
    message: "Account ACC-2207 exceeded intraday VaR limit by 12%",
    minutesAgo: 17,
    module: "order-management",
    title: "Risk Limit Alert",
  },
  {
    attributes: { priority: "2", source: "OMS" },
    connectionId: "vuu-emea",
    expired: true,
    level: "info",
    message: "Order #3916 filled 400 shares of AAPL at $187.42",
    minutesAgo: 34,
    module: "order-management",
    title: "Order Execution",
  },
  {
    attributes: { priority: "1", source: "SYSTEM" },
    connectionId: "vuu-emea",
    expired: true,
    kind: "banner",
    level: "info",
    message: "US Equity markets are now OPEN. Trading session #3 active",
    minutesAgo: 62,
    read: true,
    title: "Market Status",
  },
  {
    attributes: { priority: "3", source: "GATEWAY" },
    connectionId: "basket-uat",
    expired: true,
    level: "warning",
    message: "Intermittent packet loss detected on gateway LDN-04",
    minutesAgo: 87,
    read: true,
    title: "Connection Warning",
  },
  {
    attributes: { priority: "1", source: "PRICING" },
    connectionId: "basket-uat",
    expired: true,
    level: "info",
    message: "Connected to pricing feed NYC-07 with latency 42ms",
    minutesAgo: 105,
    module: "basket-trading",
    read: true,
    title: "Feed Synchronization",
  },
  {
    level: "success",
    message: "EU Pharma submitted",
    minutesAgo: 130,
    module: "basket-trading",
    read: true,
    title: "Basket submitted",
  },
  {
    attributes: { priority: "10", source: "OMS" },
    connectionId: "vuu-emea",
    expired: true,
    level: "error",
    message: "Order #4410 rejected by exchange: Insufficient margin",
    minutesAgo: 160,
    module: "order-management",
    read: true,
    title: "Order Rejection",
  },
];

const toNotification = (seed: Seed, index: number): PortalNotification => {
  const now = Date.now();
  const createdAt = now - seed.minutesAgo * MINUTE;
  const id = `n${index}`;
  const { connectionId } = seed;
  return {
    attributes: seed.attributes ?? {},
    createdAt,
    expired: seed.expired ?? false,
    expiresAt: connectionId ? createdAt + 18_000 : undefined,
    id,
    initial: false,
    key: connectionId ? `${connectionId}:${id}` : `client:showcase:${id}`,
    kind: seed.kind ?? "toast",
    level: seed.level,
    message: seed.message,
    origin: {
      connectionId,
      moduleIds: seed.module ? [seed.module] : [],
      source: connectionId ? "server" : "client",
    },
    read: seed.read ?? false,
    receivedAt: createdAt + 600,
    title: seed.title,
  };
};

/** Adds the seed notifications and opens the panel. */
const Seeder = ({
  doNotDisturb = false,
  seeds,
}: {
  doNotDisturb?: boolean;
  seeds: Seed[];
}) => {
  const api = usePortalNotifications();
  const presentation = useNotificationPresentation();
  // biome-ignore lint/correctness/useExhaustiveDependencies: seed once
  useEffect(() => {
    seeds.forEach((seed, i) => {
      api?.store.upsert(toNotification(seed, i));
    });
    presentation?.setDoNotDisturb(doNotDisturb);
    presentation?.openPanel();
  }, [api]);
  return (
    <Button
      appearance="bordered"
      onClick={() => presentation?.openPanel()}
      sentiment="neutral"
    >
      Open notifications
    </Button>
  );
};

const PanelShell = ({
  doNotDisturb,
  mode,
  seeds = SEEDS,
}: {
  doNotDisturb?: boolean;
  mode?: "light" | "dark";
  seeds?: Seed[];
}) => (
  <AuthenticationProvider mode="local" registry={registry}>
    <PortalShell
      density="high"
      header={false}
      id="notifications-panel-demo"
      mode={mode}
      remoteModules={registry.modules}
      serverMonitor={false}
      title="Notifications panel"
    >
      <PortalLandingPage>
        <main style={{ padding: 24 }}>
          <Seeder doNotDisturb={doNotDisturb} seeds={seeds} />
        </main>
      </PortalLandingPage>
    </PortalShell>
  </AuthenticationProvider>
);

/** Today's notifications: unread, read, expired and unattributed. */
export const Default = () => <PanelShell />;

/** Do not disturb on: the header and a notice say so. */
export const DoNotDisturb = () => <PanelShell doNotDisturb />;

/** The Default notifications in dark mode. */
export const Dark = () => <PanelShell mode="dark" />;

/** Nothing yet today. */
export const Empty = () => <PanelShell seeds={[]} />;
