import type { AuthConfig } from "./AuthConfig";
import { parseVuuUserFromToken } from "./VuuUser";

export const authenticateWithUsernamePassword = async (
  restUrl: string,
  username: string,
  password: string,
) => {
  const response = await fetch(restUrl, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "access-control-allow-origin": location.host,
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw Error(
      `Authentication failed ${response.status} ${response.statusText}`,
    );
  }

  const token = response.headers.get("vuu-auth-token");
  if (!token) {
    throw Error("Authentication failed, auth token not returned by server");
  }
  return {
    token,
    user: parseVuuUserFromToken(token),
  };
};

export class VuuLoginHandler {
  constructor(private authConfig: AuthConfig & { redirectUrl?: string }) { }

  login = async (username: string, password: string) => {
    const { token } = await authenticateWithUsernamePassword(
      this.authConfig.restUrl,
      username,
      password,
    );
    window.location.href = `${this.authConfig.redirectUrl}?token=${token}`;
  };
}
