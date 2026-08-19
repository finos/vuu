import type { AuthHandler } from "./AuthHandler";
import { parseVuuUserFromToken } from "./VuuUser";
import type { VuuAuthTarget } from "./VuuTokenExchange";
import type { VuuSessionResolver } from "./VuuSessionResolver";

export const VUU_AUTH_TOKEN_STORAGE_KEY = "vuu-auth-token";

export class DirectVuuSessionResolver implements VuuSessionResolver {
  resolve(_authHandler: AuthHandler, _target: VuuAuthTarget) {
    const token = sessionStorage.getItem(VUU_AUTH_TOKEN_STORAGE_KEY);
    if (!token) {
      return Promise.reject(Error("No VUU token returned by login service"));
    }

    const user = parseVuuUserFromToken(token);
    return Promise.resolve({
      authorizations: user.authorizations,
      token,
      user: { userName: user.name },
    });
  }
}
