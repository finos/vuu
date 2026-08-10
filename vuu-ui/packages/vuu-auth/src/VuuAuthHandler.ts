import type { AuthConfig } from "./AuthConfig";
import type { AuthHandler } from "./AuthHandler";
import { parseVuuUserFromToken } from "./VuuUser";
import type { VuuAuthTarget, VuuSession } from "./VuuTokenExchange";

export class VuuAuthHandler implements AuthHandler {
  #session: VuuSession | undefined;

  constructor(private authConfig: AuthConfig) {}

  authenticate = async () => {
    const session = this.#getSession();
    return { user: session.user };
  };

  async getIdentityToken() {
    return this.#getSession().token;
  }

  getVuuSession = async (_target: VuuAuthTarget) => this.#getSession();

  async logout() {
    this.#session = undefined;
    window.location.assign(this.authConfig.authUrl);
  }

  #getSession(): VuuSession {
    if (this.#session) {
      return this.#session;
    }

    const token = new URLSearchParams(location.search).get("token");
    if (!token) {
      window.location.assign(this.authConfig.authUrl);
      throw Error("Redirecting to VUU login");
    }

    const user = parseVuuUserFromToken(token);
    const session = {
      authorizations: user.authorizations,
      token,
      user: { userName: user.name },
    };
    this.#session = session;
    history.replaceState(null, "", location.pathname);
    return this.#session;
  }
}
