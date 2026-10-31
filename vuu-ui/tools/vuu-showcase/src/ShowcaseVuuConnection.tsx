import {
  type AuthConfig,
  type AuthHandler,
  AuthenticationProvider,
  authenticateWithUsernamePassword,
  DirectVuuSessionResolver,
  parseVuuUserFromToken,
  VUU_AUTH_TOKEN_STORAGE_KEY,
  VuuConnectionRegistry,
} from "@vuu-ui/core";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import type { ReactNode } from "react";

const SHOWCASE_CONNECTION_ID = "vuu-showcase";

// /api/authn is proxied to the local Vuu auth service by the showcase server
const authConfig: AuthConfig = {
  authUrl: "/api/authn",
  restUrl: "/api/authn",
  websocketUrl: "wss://localhost:8090/websocket",
};

/**
 * Logs in to the local Vuu server with the showcase demo user, no login
 * page is shown.
 */
class ShowcaseAuthHandler implements AuthHandler {
  #token: Promise<string> | undefined;

  constructor(private config: AuthConfig) {}

  #getToken() {
    this.#token ??= authenticateWithUsernamePassword(
      this.config.authUrl,
      "steve",
      "xyz",
    ).then(({ token }) => {
      sessionStorage.setItem(VUU_AUTH_TOKEN_STORAGE_KEY, token);
      return token;
    });
    return this.#token;
  }

  authenticate = async () => {
    const token = await this.#getToken();
    return { user: { userName: parseVuuUserFromToken(token).name } };
  };

  getIdentityToken() {
    return this.#getToken();
  }

  logout() {
    sessionStorage.removeItem(VUU_AUTH_TOKEN_STORAGE_KEY);
    this.#token = undefined;
  }
}

const registry = new VuuConnectionRegistry({
  sessionResolver: new DirectVuuSessionResolver(),
});

/** Connects examples to the local Vuu server, for remote data */
export const ShowcaseVuuConnection = ({
  children,
}: {
  children: ReactNode;
}) => (
  <AuthenticationProvider
    authConfig={authConfig}
    authHandlerClass={ShowcaseAuthHandler}
    connectionId={SHOWCASE_CONNECTION_ID}
    mode="identity"
    registry={registry}
  >
    <VuuDataSourceProvider>{children}</VuuDataSourceProvider>
  </AuthenticationProvider>
);
