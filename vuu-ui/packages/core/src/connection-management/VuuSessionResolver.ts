import type { AuthHandler } from "../auth/AuthHandler";
import { loginToVuuServer } from "../auth/VuuServerLogin";
import {
  exchangeVuuToken,
  type VuuAuthTarget,
  type VuuSession,
} from "../auth/VuuTokenExchange";

export interface VuuSessionResolver {
  resolve(authHandler: AuthHandler, target: VuuAuthTarget): Promise<VuuSession>;
}

/**
 * Exchanges the portal's identity token for a Vuu token, or, for a server
 * that uses `vuu-login`, logs in with the credentials stored for it.
 */
export class IdentityTokenSessionResolver implements VuuSessionResolver {
  constructor(
    private exchangeToken = exchangeVuuToken,
    private login = loginToVuuServer,
  ) {}

  async resolve(authHandler: AuthHandler, target: VuuAuthTarget) {
    if (target.auth === "vuu-login") {
      return this.login(target);
    }
    return this.exchangeToken(await authHandler.getIdentityToken(), target);
  }
}
