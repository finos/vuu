import ConnectionManager from "./ConnectionManager";
import { ValueOf } from "@vuu-ui/vuu-utils";
import { User, type AuthProvider } from "./VuuAuthProvider";

export const VuuAuthTokenIssuePolicy = {
  BearerToken: "bearer-token",
  UsernamePassword: "username-password",
} as const;

export type VuuAuthTokenIssuePolicy = ValueOf<typeof VuuAuthTokenIssuePolicy>;

export interface VuuAuthenticatorConstructorOptions {
  authProvider: AuthProvider;
  authTokenIssuePolicy?: VuuAuthTokenIssuePolicy;
  connectionId?: string;
  websocketUrl: string;
}

export class VuuAuthenticator {
  private authProvider: AuthProvider;
  private authTokenIssuePolicy: VuuAuthTokenIssuePolicy;
  private connectionId: string;
  private vuuAccessToken: string | null = null;
  private websocketUrl: string;

  constructor({
    authProvider,
    authTokenIssuePolicy = VuuAuthTokenIssuePolicy.BearerToken,
    connectionId = "portal",
    websocketUrl,
  }: VuuAuthenticatorConstructorOptions) {
    this.authProvider = authProvider;
    this.authTokenIssuePolicy = authTokenIssuePolicy;
    this.connectionId = connectionId;
    this.websocketUrl = websocketUrl;
  }

  private openWebsocketConnection = async (vuuToken: string) => {
    await ConnectionManager.connectTo(
      this.connectionId,
      {
        url: this.websocketUrl,
        token: vuuToken,
      },
      true,
    );
  };

  login = async (): Promise<[User, string[]] | never> => {
    const {
      authorizations,
      user = { userName: "test" },
      token,
      websocket = true,
    } = await this.authProvider.login();
    if (token && user) {
      this.vuuAccessToken = token;
      if (websocket) {
        await this.openWebsocketConnection(token);
      }
      return [user, authorizations];
    } else {
      throw Error("[VuuAuthenticator] login failed");
    }
  };

  logout = () => {
    this.vuuAccessToken = null;
    this.authProvider.logout();
  };

  getAccessToken = () => this.vuuAccessToken;
}
