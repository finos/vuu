import { init } from "@module-federation/enhanced/runtime";
import {
  AuthenticationErrorBoundary,
  AuthenticationProvider,
  KeycloakAuthHandler,
} from "@vuu-ui/core";
import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import { PageVisibilityObserver } from "@vuu-ui/vuu-utils";
import { createRoot } from "react-dom/client";
import { App } from "./App";

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
      <AuthenticationErrorBoundary
        fallback={(error) => (
          <div role="alert">Unable to authenticate: {error.message}</div>
        )}
      >
        <AuthenticationProvider
          authConfig={config}
          authHandlerClass={KeycloakAuthHandler}
          mode="identity"
        >
          <App />
        </AuthenticationProvider>
      </AuthenticationErrorBoundary>,
    );
  } catch (err: unknown) {
    console.error(err);
  }
}

start();
