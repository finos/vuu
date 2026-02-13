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
  websocketUrl: string;
}

export class VuuAuthenticator {
  private authProvider: AuthProvider;
  private authTokenIssuePolicy: VuuAuthTokenIssuePolicy;
  private websocketUrl: string;

  constructor({
    authProvider,
    authTokenIssuePolicy = VuuAuthTokenIssuePolicy.BearerToken,
    websocketUrl,
  }: VuuAuthenticatorConstructorOptions) {
    this.authProvider = authProvider;
    this.authTokenIssuePolicy = authTokenIssuePolicy;
    this.websocketUrl = websocketUrl;
  }

  private openWebsocketConnection = async (vuuToken: string) => {
    await ConnectionManager.connect(
      {
        url: this.websocketUrl,
        token: vuuToken,
      },
      true,
    );
  };

  login = async (): Promise<[User, string[]] | never> => {
    const { authorizations, user, token } = await this.authProvider.login();
    if (token && user) {
      await this.openWebsocketConnection(token);
      return [user, authorizations];
    } else {
      throw Error("[VuuAuthenticator] login failed");
    }
  };

  logout = () => {
    this.authProvider.logout();
  };
}
