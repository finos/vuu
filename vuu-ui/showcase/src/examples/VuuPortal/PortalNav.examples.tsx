import {
  PortalNav,
  type RemoteModuleDescriptor,
} from "@vuu-ui/core/portal";

const remoteModule = (path: string): RemoteModuleDescriptor => {
  const name = path.split("/").filter(Boolean).at(-1) ?? path;
  const moduleName = name.toLowerCase();

  return {
    clientIdentifier: `vuu-${moduleName}`,
    description: `${name} remote module`,
    id: name.toLowerCase(),
    location: "remote",
    loginRole: `${moduleName}-login`,
    mfComponent: name,
    mfScope: moduleName,
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
