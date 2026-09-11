import { init } from "@module-federation/enhanced/runtime";
import {
  AuthenticationErrorBoundary,
  AuthenticationProvider,
  KeycloakAuthHandler,
} from "@vuu-ui/core";
import { ConnectionManager } from "@vuu-ui/vuu-data-remote";
import { PageVisibilityObserver } from "@vuu-ui/vuu-utils";
import { type ReactNode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

const getError = (reason: unknown) =>
  reason instanceof Error ? reason : Error(String(reason));

const FederationRuntimeErrorHandler = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const nextError = getError(event.reason);
      if (!nextError.message.startsWith("[ Federation Runtime ]")) {
        return;
      }

      event.preventDefault();
      setError(nextError);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
  }, []);

  if (error) {
    return (
      <div role="alert">
        <h1>Unable to load the portal module</h1>
        <p>
          A portal module is incompatible with the VUU version used by this
          application. Contact your portal administrator to deploy compatible
          versions.
        </p>
        <p>{error.message}</p>
      </div>
    );
  }

  return children;
};

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
      <FederationRuntimeErrorHandler>
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
        </AuthenticationErrorBoundary>
      </FederationRuntimeErrorHandler>,
    );
  } catch (err: unknown) {
    console.error(err);
  }
}

start();
