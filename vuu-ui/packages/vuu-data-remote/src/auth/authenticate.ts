import { parseVuuUserFromToken, type VuuUser } from "@vuu-ui/vuu-auth";

const defaultAuthUrl = "api/authn";

export type AuthenticationResponse = {
  token: string;
  user: VuuUser;
};

export const getVuuAuthToken = async (
  authUrl: string,
  token: string,
): Promise<{ authorizations: string[]; token: string }> => {
  const response = await fetch(authUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw Error("Authentication error: Auth token failure");
  }
  const json = await response.json();
  const vuuUser = parseVuuUserFromToken(json.token);
  return {
    authorizations: vuuUser.authorizations,
    token: json.token,
  };
};

export const authenticate = async (
  username: string,
  password: string,
  authUrl = defaultAuthUrl,
): Promise<AuthenticationResponse> => {
  return fetch(authUrl, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "access-control-allow-origin": location.host,
    },
    body: JSON.stringify({ username, password }),
  }).then((response) => {
    if (response.ok) {
      const authToken = response.headers.get("vuu-auth-token");
      if (typeof authToken === "string" && authToken.length > 0) {
        try {
          return {
            token: authToken,
            user: parseVuuUserFromToken(authToken),
          };
        } catch {
          throw Error("Authentication error:  vuu auth token decoding failed.");
        }
      } else {
        throw Error("Authentication failed auth token not returned by server");
      }
    } else {
      throw Error(
        `Authentication failed ${response.status} ${response.statusText}`,
      );
    }
  });
};
