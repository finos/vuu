import Keycloak from "keycloak-js";
import type { AuthConfig } from "./AuthConfig";
import type { AuthHandler } from "./AuthHandler";

/**
 * How long to wait for the identity provider to respond before reporting it
 * unreachable.
 */
const IDENTITY_PROVIDER_TIMEOUT_MS = 5000;

/**
 * The identity provider (Keycloak) could not be reached, e.g. it is not
 * running, the url is wrong, or the browser does not trust its certificate.
 */
export class IdentityProviderUnavailableError extends Error {
  constructor(
    readonly url: string,
    cause?: unknown,
  ) {
    super(`Unable to reach the identity provider at ${url}`, { cause });
    this.name = "IdentityProviderUnavailableError";
  }
}

let keycloak: Keycloak | undefined;
let initialization: Promise<boolean> | undefined;
let identityTokenRefresh: Promise<string> | undefined;

const getRealm = ({ realm = "vuu" }: AuthConfig) => realm;
const getAuthUrl = ({ authUrl }: AuthConfig) => authUrl.replace(/\/+$/, "");

const getKeycloak = (authConfig: AuthConfig) => {
  if (!keycloak) {
    const { clientId = "vuu-portal" } = authConfig;
    keycloak = new Keycloak({
      url: getAuthUrl(authConfig),
      realm: getRealm(authConfig),
      clientId,
    });
  }

  return keycloak;
};

/**
 * Fails fast when the identity provider is unreachable. Keycloak itself only
 * reports this after a 10s timeout, as an unrelated iframe error. The request
 * is opaque (no-cors): any response means the server is reachable.
 */
const checkIdentityProviderReachable = async (authConfig: AuthConfig) => {
  const url = getAuthUrl(authConfig);
  const realmUrl = `${url}/realms/${encodeURIComponent(getRealm(authConfig))}`;
  try {
    await fetch(`${realmUrl}/.well-known/openid-configuration`, {
      cache: "no-store",
      mode: "no-cors",
      signal: AbortSignal.timeout(IDENTITY_PROVIDER_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new IdentityProviderUnavailableError(url, cause);
  }
};

const initializeKeycloak = async (authConfig: AuthConfig) => {
  await checkIdentityProviderReachable(authConfig);
  return getKeycloak(authConfig).init({
    onLoad: "login-required",
    redirectUri: location.origin + location.pathname,
  });
};

export class KeycloakAuthHandler implements AuthHandler {
  constructor(private authConfig: AuthConfig) {}

  authenticate = async () => {
    initialization ??= initializeKeycloak(this.authConfig).catch((error) => {
      // A Keycloak instance can only be initialized once, start again on retry.
      initialization = undefined;
      keycloak = undefined;
      throw error;
    });
    if (!(await initialization)) {
      throw Error("Keycloak authentication failed");
    }

    const { tokenParsed } = getKeycloak(this.authConfig);
    const userName = tokenParsed?.preferred_username;
    if (!userName) {
      throw Error("No username from Keycloak");
    }

    const { given_name, family_name, email } = tokenParsed ?? {};
    return {
      user: {
        userName,
        firstName: given_name,
        lastName: family_name,
        email,
      },
    };
  };

  async getIdentityToken() {
    if (!identityTokenRefresh) {
      const keycloak = getKeycloak(this.authConfig);
      identityTokenRefresh = keycloak
        .updateToken(-1)
        .then(() => {
          if (keycloak.token) {
            return keycloak.token;
          }
          throw Error("No identity token from Keycloak");
        })
        .finally(() => {
          identityTokenRefresh = undefined;
        });
    }
    return identityTokenRefresh;
  }

  async logout() {
    await getKeycloak(this.authConfig).logout();
  }
}
