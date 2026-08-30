import type { AuthHandler } from "../auth/AuthHandler";
import {
  exchangeVuuToken,
  type VuuAuthTarget,
  type VuuSession,
} from "../auth/VuuTokenExchange";

export interface VuuSessionResolver {
  resolve(authHandler: AuthHandler, target: VuuAuthTarget): Promise<VuuSession>;
}

export class IdentityTokenSessionResolver implements VuuSessionResolver {
  constructor(private exchangeToken = exchangeVuuToken) {}

  async resolve(authHandler: AuthHandler, target: VuuAuthTarget) {
    return this.exchangeToken(await authHandler.getIdentityToken(), target);
  }
}
