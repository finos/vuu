import { init } from "@module-federation/enhanced/runtime";
import { AuthenticationProvider } from "@vuu-ui/core";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { localPortalModuleRegistry } from "./local-module-registry";

import "@vuu-ui/vuu-icons/index.css";

init({
  name: "host",
  remotes: [],
});

const container = document.getElementById("root");
if (!container) {
  throw Error("No react root defined in page");
}

createRoot(container).render(
  <AuthenticationProvider mode="local" registry={localPortalModuleRegistry}>
    <App DataSourceProvider={LocalDataSourceProvider} />
  </AuthenticationProvider>,
);
