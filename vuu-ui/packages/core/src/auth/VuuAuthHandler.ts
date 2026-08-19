import type { AuthConfig } from "./AuthConfig";
import type { AuthHandler } from "./AuthHandler";
import { VUU_AUTH_TOKEN_STORAGE_KEY } from "./DirectVuuSessionResolver";
import { parseVuuUserFromToken } from "./VuuUser";

export class VuuAuthHandler implements AuthHandler {
  constructor(private authConfig: AuthConfig) {}

  authenticate = async () => {
    const token = this.#getToken();
    return { user: { userName: parseVuuUserFromToken(token).name } };
  };

  async getIdentityToken() {
    return this.#getToken();
  }

  async logout() {
    sessionStorage.removeItem(VUU_AUTH_TOKEN_STORAGE_KEY);
    window.location.assign(this.authConfig.authUrl);
  }

  #getToken(): string {
    const token = new URLSearchParams(location.search).get("token");
    if (token) {
      sessionStorage.setItem(VUU_AUTH_TOKEN_STORAGE_KEY, token);
      history.replaceState(null, "", location.pathname);
      return token;
    }

    const storedToken = sessionStorage.getItem(VUU_AUTH_TOKEN_STORAGE_KEY);
    if (storedToken) {
      return storedToken;
    }

    window.location.assign(this.authConfig.authUrl);
    throw Error("Redirecting to VUU login");
  }
}
