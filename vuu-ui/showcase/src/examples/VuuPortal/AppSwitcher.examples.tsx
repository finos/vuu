import {
  PortalAppSwitcher,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { dashBoardIcon, ordersIcon, positionsIcon } from "./portal-icons";

const remoteModule = (
  navLocation: string,
  {
    navIconName,
    navIconUrl,
  }: Partial<Omit<RemoteModuleDescriptor, "navLocation">> | undefined = {},
): RemoteModuleDescriptor => {
  const name = navLocation.split("/").filter(Boolean).at(-1) ?? navLocation;
  const path = navLocation.toLowerCase();
  const moduleName = name.toLowerCase();

  return {
    clientIdentifier: `vuu-${moduleName}`,
    description: `${name} remote module`,
    id: path,
    navLocation,
    accessRole: `${moduleName}-access`,
    mfComponent: name,
    mfScope: moduleName,
    mfUrl: `http://localhost:5001/${moduleName}/mf-manifest.json`,
    name: moduleName,
    navIconName,
    navIconUrl,
    path,
    title: name,
    version: 1,
  };
};

const singleLevelModules = [
  remoteModule("/Dashboard", { navIconUrl: dashBoardIcon }),
  remoteModule("/Orders", { navIconUrl: ordersIcon }),
  remoteModule("/Positions", { navIconUrl: positionsIcon }),
];

const twoLevelModules = [
  remoteModule("/Trading/Baskets"),
  remoteModule("/Trading/Orders"),
  remoteModule("/Trading/Positions"),
  remoteModule("/Reference/Instruments"),
  remoteModule("/Reference/Exchanges"),
  remoteModule("/Administration"),
];

const AppSwitcherFrame = ({
  children,
  width = 280,
}: {
  children: ReactNode;
  width?: number;
}) => (
  <MemoryRouter initialEntries={["/trading/orders"]}>
    <div style={{ alignItems: "start", display: "flex", width }}>
      {children}
      <div style={{ backgroundColor: "brown", height: 400, width: 200 }} />
    </div>
  </MemoryRouter>
);

export const SingleLevelAppSwitcher = () => (
  <AppSwitcherFrame>
    <PortalAppSwitcher
      displayStyle="text-only"
      menuStyle="single-level"
      remoteModules={singleLevelModules}
    />
  </AppSwitcherFrame>
);

export const NestedAppSwitcher = () => (
  <AppSwitcherFrame>
    <PortalAppSwitcher
      displayStyle="text-only"
      menuStyle="two-level"
      remoteModules={twoLevelModules}
    />
  </AppSwitcherFrame>
);

export const IconOnlyAppSwitcher = () => (
  <AppSwitcherFrame>
    <PortalAppSwitcher
      displayStyle="icon-only"
      remoteModules={singleLevelModules}
    />
  </AppSwitcherFrame>
);

export const IconTextAppSwitcher = () => (
  <AppSwitcherFrame>
    <PortalAppSwitcher
      displayStyle="icon text"
      menuStyle="two-level"
      remoteModules={twoLevelModules}
    />
  </AppSwitcherFrame>
);
