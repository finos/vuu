import {
  AuthenticationErrorBoundary,
  AuthenticationProvider,
  DirectVuuSessionResolver,
  VuuAuthHandler,
  VuuConnectionError,
  VuuConnectionRegistry,
} from "@vuu-ui/core";
import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import { PageVisibilityObserver } from "@vuu-ui/vuu-utils";
import { createRoot } from "react-dom/client";
import { App } from "./src/App";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

const config = await vuuConfig;
const VUU_CONNECTION_ID = "vuu-sample-app";
const registry = new VuuConnectionRegistry({
  sessionResolver: new DirectVuuSessionResolver(),
});

new PageVisibilityObserver({
  onHidden: () => {
    ConnectionManager.disableActiveSubscriptions();
  },
  onVisible: () => {
    ConnectionManager.enableActiveSubscriptions();
  },
});

const ConnectionErrorMessage = ({ error }: { error: Error }) => {
  // Invalid or expired token, e.g. the token was issued before the VUU
  // server was restarted. The user must log in again to get a new one.
  if (error instanceof VuuConnectionError && error.loginError) {
    return (
      <div role="alert">
        <p>VUU server rejected login: {error.loginError}</p>
        <button
          type="button"
          onClick={() => new VuuAuthHandler(config).logout()}
        >
          Log in again
        </button>
      </div>
    );
  }
  return (
    <div role="alert">
      <p>{error.message}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
};

const container = document.getElementById("root");
if (!container) {
  throw Error("No react root defined in page");
}
try {
  const root = createRoot(container);
  root.render(
    <AuthenticationErrorBoundary
      fallback={(error) => <ConnectionErrorMessage error={error} />}
    >
      <AuthenticationProvider
        authConfig={config}
        authHandlerClass={VuuAuthHandler}
        connectionId={VUU_CONNECTION_ID}
        mode="identity"
        registry={registry}
      >
        <App />
      </AuthenticationProvider>
    </AuthenticationErrorBoundary>,
  );
} catch (err: unknown) {
  console.error(err);
}
