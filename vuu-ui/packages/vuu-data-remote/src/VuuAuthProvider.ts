import type { AuthConfig } from "@vuu-ui/vuu-utils";
import { parseVuuUserFromToken } from "./authenticate";

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
  logout: () => void;
}

export type AuthProviderClass = new (config: AuthConfig) => AuthProvider;

/**
 * The Vuu AuthProvider is a simple Demoware auth provider that
 * grabs username and pasdsword from. a simple login form and
 * exchanges these for a Vuu Token. Password is manipulated in
 * plain text, hence not suitable for real world usage.
 *
 * This AuthProvider is used by the login panel, which sets
 * user credentials in cookies.
 * It is then used by the application itself to retrieve the
 * credentials and login to vuu.
 */
export class VuuAuthProvider implements AuthProvider {
  constructor(private authConfig: AuthConfig) { }

  login = async (username?: string, password?: string) => {
    const date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

    if (username && password) {
      // coming from login panel

      // TODO what if the authorizations have changed
      const { token } = await this.getVuuTokenWithUsernameAndPassword(
        username,
        password,
      );
      // document.cookie = `vuu-auth-user=${username};expires=${date.toUTCString()};path=/`;
      // document.cookie = `vuu-auth-password=${password};expires=${date.toUTCString()};path=/`;
      // document.cookie = `vuu-auth-token=${token};expires=${date.toUTCString()};path=/`;
      return this.redirectToApplication(token) as never;
    } else {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      console.log(`token ${token}`);

      // const userName = getCookieValue("vuu-auth-user");
      // const password = getCookieValue("vuu-auth-password");
      if (token) {
        // const { authorizations, token } =
        //   await this.getVuuTokenWithUsernameAndPassword(userName, password);
        // document.cookie = `vuu-auth-token=${token};expires=${date.toUTCString()};path=/`;

        const { authorizations, name } = parseVuuUserFromToken(token);
        return {
          authorizations,
          token,
          user: { userName: name }
        }

      } else {
        return this.redirectToLoginPage() as never;
      }
    }
  };

  private async getVuuTokenWithBearerToken(bearerToken: string) {
    try {
      const response = await fetch(this.authConfig.restUrl, {
        headers: { Authorization: `Bearer: ${bearerToken}` }
      });
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Application unavailable');
        } else {
          throw new Error('Auth token failure');
        }
      }

      const json = await response.json();
      if (!json.token) {
        throw new Error('Missing token in response')
      }

      const { authorizations, name } = parseVuuUserFromToken(json.token);
      return {
        authorizations,
        token: json.token,
        user: { username: name }
      }
    } catch (_e: unknown) {
      throw new Error('Application unavailable');
    }

  }

  private async getVuuTokenWithUsernameAndPassword(
    username: string,
    password: string,
  ) {
    const response = await fetch(this.authConfig.restUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "access-control-allow-origin": location.host,
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (response.ok) {
      const vuuAuthToken = response.headers.get("vuu-auth-token");
      if (typeof vuuAuthToken === "string" && vuuAuthToken.length > 0) {
        const { authorizations } = parseVuuUserFromToken(vuuAuthToken);
        return { authorizations, token: vuuAuthToken };
      } else {
        throw Error('Authentication failed auth token not returned by server');
      }
    } else {
      throw Error(`Authentication failed, ${response.status}`);
    }
  }

  private clear() {
    // document.cookie =
    //   "vuu-auth-user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    // document.cookie =
    //   "vuu-auth-password= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    // document.cookie =
    //   "vuu-auth-token= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  }

  private redirectToLoginPage() {
    window.location.href = "http://localhost:5001/index.html";
  }

  private redirectToApplication(token: string) {
    window.location.href = `http://localhost:5002/index.html?token=${token}`;
  }

  logout() {
    this.clear();
    this.redirectToLoginPage();
  }
}
