import ConnectionManager from "./ConnectionManager";
import { ValueOf } from "@vuu-ui/vuu-utils";
import { type AuthProvider } from "./VuuAuthProvider";

export const VuuAuthTokenIssuePolicy = {
  BearerToken: "bearer-token",
  UsernamePassword: "username-password",
} as const;

export type VuuAuthTokenIssuePolicy = ValueOf<typeof VuuAuthTokenIssuePolicy>;

export interface VuuAuthenticatorConstructorOptions {
  authProvider: AuthProvider;
  authTokenIssuePolicy?: VuuAuthTokenIssuePolicy;
}

export class VuuAuthenticator {
  private authProvider: AuthProvider;
  private authTokenIssuePolicy: VuuAuthTokenIssuePolicy;

  constructor({
    authProvider,
    authTokenIssuePolicy = VuuAuthTokenIssuePolicy.BearerToken,
  }: VuuAuthenticatorConstructorOptions) {
    this.authProvider = authProvider;
    this.authTokenIssuePolicy = authTokenIssuePolicy;
  }

  private openWebsocketConnection = async (vuuToken: string) => {
    const { websocketUrl } = await vuuConfig;
    await ConnectionManager.connect(
      {
        url: websocketUrl,
        token: vuuToken,
      },
      true,
    );
  };

  login = async (): Promise<[{ username: string }, string[]] | never> => {
    const { user, token } = await this.authProvider.login();
    if (token && user) {
      await this.openWebsocketConnection(token);
      return [user, []];
    } else {
      throw Error("[VuuAuthenticator] login failed");
    }
  };

  logout = () => {
    this.authProvider.logout();
  };
}
