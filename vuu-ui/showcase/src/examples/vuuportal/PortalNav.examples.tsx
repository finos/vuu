import { PortalNav } from "../../../../sample-apps/vuu-portal/src/components/portal-nav/PortalNav";
import type { RemoteModuleDescriptor } from "../../../../sample-apps/vuu-portal/src/module-federation/mf-utils";

const remoteModule = (path: string): RemoteModuleDescriptor => {
  const name = path.split("/").filter(Boolean).at(-1) ?? path;

  return {
    description: `${name} remote module`,
    id: name.toLowerCase(),
    location: "remote",
    mfComponent: name,
    mfScope: name.toLowerCase(),
    mfUrl: `http://localhost:5001/${name}/mf-manifest.json`,
    name,
    path,
    title: name,
    version: 1,
  };
};

export const FlatPortalNav = () => (
  <PortalNav
    remoteModules={[
      remoteModule("/Dashboard"),
      remoteModule("/Orders"),
      remoteModule("/Positions"),
    ]}
  />
);

export const NestedPortalNav = () => (
  <PortalNav
    remoteModules={[
      remoteModule("/Trading/Baskets"),
      remoteModule("/Trading/Orders"),
      remoteModule("/Trading/Positions"),
      remoteModule("/Reference/Instruments"),
      remoteModule("/Reference/Exchanges"),
      remoteModule("/Administration"),
    ]}
  />
);
