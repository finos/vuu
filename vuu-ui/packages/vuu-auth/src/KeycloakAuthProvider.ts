import { parseVuuUserFromToken } from "@vuu-ui/vuu-data-remote";
import Keycloak from "keycloak-js";
import type { AuthConfig } from "./AuthConfig";
import type { AuthProvider } from "./AuthProvider";

let keycloak: Keycloak;

const getKeycloak = (authConfig: AuthConfig) => {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: authConfig.authUrl,
      realm: "vuu",
      clientId: "vuu-portal",
    });
  }

  return keycloak;
};

export class KeycloakAuthProvider implements AuthProvider {
  #firstTimeIn = true;

  constructor(private authConfig: AuthConfig) {}

  login = async () => {
    if (this.#firstTimeIn) {
      const keycloak = getKeycloak(this.authConfig);
      const authenticated = await keycloak.init({
        onLoad: "login-required",
        redirectUri: location.origin + location.pathname,
      });

      if (!authenticated) {
        throw Error("Keycloak authentication failed");
      }

      this.#firstTimeIn = false;
    } else {
      await keycloak.updateToken();
    }

    const userName = keycloak.tokenParsed?.preferred_username;
    const bearerToken = keycloak.token;
    if (!bearerToken || !userName) {
      throw Error("No bearer token or username from keycloak");
    }

    const { authorizations, token } =
      await this.getVuuTokenWithBearerToken(bearerToken);
    return {
      authorizations,
      bearerToken,
      user: { userName },
      token,
    };
  };

  async getToken() {
    await keycloak.updateToken();
    if (keycloak.token) {
      return keycloak.token;
    }
    throw Error("No bearer token from keycloak");
  }

  logout() {
    keycloak.logout();
  }

  private async getVuuTokenWithBearerToken(bearerToken: string) {
    const response = await fetch(this.authConfig.restUrl, {
      headers: { Authorization: `Bearer: ${bearerToken}` },
    });
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Application unavailable");
      }
      throw new Error("Auth token failure");
    }

    const json: unknown = await response.json();
    if (
      json === null ||
      typeof json !== "object" ||
      !("token" in json) ||
      typeof json.token !== "string"
    ) {
      throw new Error("Missing token in response");
    }

    const { authorizations } = parseVuuUserFromToken(json.token);
    return {
      authorizations,
      token: json.token,
    };
  }
}
