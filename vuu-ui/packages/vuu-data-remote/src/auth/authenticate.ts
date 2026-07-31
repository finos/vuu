import type { VuuUser } from "@vuu-ui/vuu-protocol-types";

const defaultAuthUrl = "api/authn";

const isValidVuuUser = (response: unknown): response is VuuUser =>
  typeof response === "object" &&
  response !== null &&
  "name" in response &&
  "authorizations" in response &&
  typeof response.name === "string" &&
  Array.isArray(response.authorizations);

/**
 * The auth token returned from authn call encodes (Base64) a VuuUser
 * within the first part of the token.
 */
export const parseVuuUserFromToken = (token: string) => {
  const [base64EncodedVuuUser] = token.split(".");
  const jsonString = atob(base64EncodedVuuUser);
  const response = JSON.parse(jsonString);
  if (isValidVuuUser(response)) {
    return response;
  } else {
    throw Error(`auth token does not containe VuuUser`);
  }
};

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
        } catch (e) {
          throw Error(`Authentication error:  vuu auth token decoding failed.`);
        }
      } else {
        throw Error(`Authentication failed auth token not returned by server`);
      }
    } else {
      throw Error(
        `Authentication failed ${response.status} ${response.statusText}`,
      );
    }
  });
};
