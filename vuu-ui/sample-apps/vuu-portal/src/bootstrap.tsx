import { init } from "@module-federation/enhanced/runtime";
import {
  ConnectionManager,
} from "@vuu-ui/vuu-data-remote";
import { AuthenticationProvider } from "@vuu-ui/vuu-shell";
import { PageVisibilityObserver } from "@vuu-ui/vuu-utils";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { KeycloakAuthProvider } from "./keycloak-authentication/KeycloakAuthProvider";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

init({
  name: "host",
  remotes: [],
});


const config = await vuuConfig;


// this can go in the shell
new PageVisibilityObserver({
  onHidden: () => {
    ConnectionManager.disableActiveSubscriptions();
  },
  onVisible: () => {
    ConnectionManager.enableActiveSubscriptions();
  },
});


async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) {
    throw Error("No react root defined in page");
  }
  try {
    const root = createRoot(container);
    root.render(
      <AuthenticationProvider authConfig={config} authProviderClass={KeycloakAuthProvider}>
        <App />
      </AuthenticationProvider>);
  } catch (err: unknown) {
    console.error(err);
  }
}

start();
