import type { AuthHandler } from "./AuthHandler";
import {
  exchangeVuuToken,
  type VuuAuthTarget,
  type VuuSession,
} from "./VuuTokenExchange";

export interface VuuSessionResolver {
  resolve(authHandler: AuthHandler, target: VuuAuthTarget): Promise<VuuSession>;
}

export class IdentityTokenSessionResolver implements VuuSessionResolver {
  constructor(private exchangeToken = exchangeVuuToken) {}

  async resolve(authHandler: AuthHandler, target: VuuAuthTarget) {
    return this.exchangeToken(await authHandler.getIdentityToken(), target);
  }
}
