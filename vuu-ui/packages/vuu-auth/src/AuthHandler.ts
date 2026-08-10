import type { AuthConfig } from "./AuthConfig";
import type { VuuAuthTarget, VuuSession } from "./VuuTokenExchange";

export type User = {
  userName: string;
};

export interface AuthenticatedIdentity {
  user: User;
}

export interface AuthHandler {
  authenticate: () => Promise<AuthenticatedIdentity>;
  getIdentityToken: () => Promise<string>;
  getVuuSession?: (target: VuuAuthTarget) => Promise<VuuSession>;
  logout: () => Promise<void> | void;
}

export type AuthHandlerClass = new (config: AuthConfig) => AuthHandler;
