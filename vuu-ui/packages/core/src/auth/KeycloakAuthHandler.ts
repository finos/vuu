import Keycloak from "keycloak-js";
import type { AuthConfig } from "./AuthConfig";
import type { AuthHandler } from "./AuthHandler";

let keycloak: Keycloak;
let initialization: Promise<boolean> | undefined;

const getKeycloak = (authConfig: AuthConfig) => {
  if (!keycloak) {
    const { authUrl: url, realm = 'vuu', clientId = 'vuu-portal' } = authConfig;
    keycloak = new Keycloak({
      url,
      realm,
      clientId,
    });
  }

  return keycloak;
};

export class KeycloakAuthHandler implements AuthHandler {
  constructor(private authConfig: AuthConfig) { }

  authenticate = async () => {
    const keycloak = getKeycloak(this.authConfig);
    initialization ??= keycloak.init({
      onLoad: "login-required",
      redirectUri: location.origin + location.pathname,
    });
    if (!(await initialization)) {
      throw Error("Keycloak authentication failed");
    }

    const userName = keycloak.tokenParsed?.preferred_username;
    if (!userName) {
      throw Error("No username from Keycloak");
    }

    return { user: { userName } };
  };

  async getIdentityToken() {
    await getKeycloak(this.authConfig).updateToken(30);
    if (keycloak.token) {
      return keycloak.token;
    }
    throw Error("No identity token from Keycloak");
  }

  async logout() {
    await getKeycloak(this.authConfig).logout();
  }
}
