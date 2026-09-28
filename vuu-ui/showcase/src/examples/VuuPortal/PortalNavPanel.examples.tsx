import {
  PortalNavPanel,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";
import { MemoryRouter } from "react-router-dom";
import { dashBoardIcon, ordersIcon, positionsIcon } from "./portal-icons";

const remoteModule = (
  navLocation: string,
  icon: Pick<RemoteModuleDescriptor, "navIconName" | "navIconUrl"> = {},
): RemoteModuleDescriptor => {
  const name = navLocation.split("/").filter(Boolean).at(-1) ?? navLocation;
  const moduleName = name.toLowerCase();
  const path = navLocation.toLowerCase();
  return {
    accessRole: `${moduleName}-access`,
    clientIdentifier: `vuu-${moduleName}`,
    description: `${name} remote module`,
    id: path,
    mfComponent: name,
    mfScope: moduleName,
    mfUrl: `http://localhost:5001/${moduleName}/mf-manifest.json`,
    name: moduleName,
    navLocation,
    path,
    title: name,
    version: 1,
    ...icon,
  };
};

const remoteModules = [
  remoteModule("/Dashboard", { navIconUrl: dashBoardIcon }),
  remoteModule("/Trading/Orders", { navIconUrl: ordersIcon }),
  remoteModule("/Trading/Positions", { navIconUrl: positionsIcon }),
  remoteModule("/Trading/Baskets", { navIconName: "box" }),
  remoteModule("/Reference/Instruments"),
  remoteModule("/Administration"),
];

export const DefaultPortalNavPanel = () => (
  <MemoryRouter>
    <PortalNavPanel remoteModules={remoteModules} />
  </MemoryRouter>
);
