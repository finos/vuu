import type { AuthConfig } from "./AuthConfig";

export type User = {
  userName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export interface AuthenticatedIdentity {
  user: User;
}

export interface AuthHandler {
  authenticate: () => Promise<AuthenticatedIdentity>;
  getIdentityToken: () => Promise<string>;
  logout: () => Promise<void> | void;
}

export type AuthHandlerClass = new (config: AuthConfig) => AuthHandler;
