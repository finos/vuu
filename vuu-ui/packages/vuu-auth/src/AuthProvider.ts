import type { AuthConfig } from "@vuu-ui/vuu-utils";

export type User = {
  userName: string;
};

export interface AuthProvider {
  login: (
    username?: string,
    password?: string,
  ) => Promise<{
    authorizations: string[];
    token: string;
    user: User;
    websocket?: boolean;
  }>;
  getToken: () => Promise<string>;
  logout: () => void;
}

export type AuthProviderClass = new (config: AuthConfig) => AuthProvider;
