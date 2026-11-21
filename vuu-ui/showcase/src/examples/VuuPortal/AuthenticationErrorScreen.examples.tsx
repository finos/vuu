import {
  AuthenticationErrorScreen,
  IdentityProviderUnavailableError,
  VuuConnectionError,
  VuuTokenExchangeError,
} from "@vuu-ui/core";
import { useState } from "react";

const restUrl = "https://localhost:9443/api/authn";

const keycloakUnavailable = new IdentityProviderUnavailableError(
  "https://localhost:8080",
  new TypeError("Failed to fetch"),
);

const vuuServerUnavailable = new VuuConnectionError(
  "portal",
  new VuuTokenExchangeError(
    `Unable to reach the VUU authentication service at ${restUrl}`,
    undefined,
    "service-unavailable",
    { cause: new TypeError("Failed to fetch"), url: restUrl },
  ),
);

const accessDenied = new VuuConnectionError(
  "portal",
  new VuuTokenExchangeError("VUU authorization denied for portal (403)", 403),
);

/** Try again increments a counter instead of reloading the page. */
const RetryCount = ({ error }: { error: Error }) => {
  const [retries, setRetries] = useState(0);
  return (
    <>
      <AuthenticationErrorScreen
        error={error}
        mode="light"
        onRetry={() => setRetries((count) => count + 1)}
      />
      <output aria-label="Retries" style={{ display: "none" }}>
        {retries}
      </output>
    </>
  );
};

export const KeycloakUnavailable = () => (
  <RetryCount error={keycloakUnavailable} />
);

export const KeycloakUnavailableDark = () => (
  <AuthenticationErrorScreen
    error={keycloakUnavailable}
    mode="dark"
    onRetry={() => undefined}
  />
);

export const VuuServerUnavailable = () => (
  <RetryCount error={vuuServerUnavailable} />
);

export const AccessDenied = () => <RetryCount error={accessDenied} />;

export const UnknownError = () => (
  <RetryCount error={Error("Keycloak authentication failed")} />
);
