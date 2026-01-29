import { getCookieValue } from "@vuu-ui/vuu-utils";

export type User = {
  username: string;
};

export interface AuthProvider {
  login: (
    username?: string,
    password?: string,
  ) => Promise<{ user: User; token: string }>;
  logout: () => void;
}

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
  constructor(private authEndpoint: string) {}

  login = async (username?: string, password?: string) => {
    const date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

    if (username && password) {
      // coming from login panel

      // do we do this here ?
      const token = await this.getVuuTokenWithUsernameAndPassword(
        username,
        password,
      );
      document.cookie = `vuu-auth-user=${username};expires=${date.toUTCString()};path=/`;
      document.cookie = `vuu-auth-password=${password};expires=${date.toUTCString()};path=/`;
      document.cookie = `vuu-auth-token=${token};expires=${date.toUTCString()};path=/`;
      return this.redirectToApplication() as never;
    } else {
      const username = getCookieValue("vuu-auth-user");
      const password = getCookieValue("vuu-auth-password");
      if (username && password) {
        const token = await this.getVuuTokenWithUsernameAndPassword(
          username,
          password,
        );
        document.cookie = `vuu-auth-token=${token};expires=${date.toUTCString()};path=/`;

        return {
          user: {
            username,
          },
          token,
        };
      } else {
        return this.redirectToLoginPage() as never;
      }
    }
  };

  private async getVuuTokenWithUsernameAndPassword(
    username: string,
    password: string,
  ) {
    const response = await fetch(this.authEndpoint, {
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
      const authToken = response.headers.get("vuu-auth-token");
      if (typeof authToken === "string" && authToken.length > 0) {
        return authToken;
      } else {
        throw Error(`Authentication failed auth token not returned by server`);
      }
    } else {
      throw Error(`Authentication failed, ${response.status}`);
    }
  }

  private clear() {
    document.cookie =
      "vuu-auth-user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "vuu-auth-password= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "vuu-auth-token= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  }

  private redirectToLoginPage() {
    window.location.href = "login.html";
  }

  private redirectToApplication() {
    window.location.href = "index.html";
  }

  logout() {
    this.clear();
    this.redirectToLoginPage();
  }
}
