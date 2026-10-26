import {
  type VuuAuthTarget,
  type VuuSession,
  VuuTokenExchangeError,
} from "./VuuTokenExchange";
import { parseVuuUserFromToken } from "./VuuUser";

export interface VuuServerCredentials {
  password: string;
  username: string;
}

const storageKey = (connectionId: string) =>
  `vuu-server-credentials/${connectionId}`;

/**
 * Credentials for servers that use `vuu-login`, kept in session storage so
 * they last until the browser tab closes and are never saved with the
 * user's portal state.
 */
export const getVuuServerCredentials = (
  connectionId: string,
): VuuServerCredentials | undefined => {
  try {
    const value: unknown = JSON.parse(
      sessionStorage.getItem(storageKey(connectionId)) ?? "null",
    );
    if (
      typeof value === "object" &&
      value !== null &&
      "username" in value &&
      "password" in value &&
      typeof value.username === "string" &&
      typeof value.password === "string"
    ) {
      return { password: value.password, username: value.username };
    }
  } catch {
    // Unreadable storage is the same as no credentials.
  }
  return undefined;
};

export const setVuuServerCredentials = (
  connectionId: string,
  credentials: VuuServerCredentials,
) => {
  try {
    sessionStorage.setItem(
      storageKey(connectionId),
      JSON.stringify(credentials),
    );
  } catch {
    // Without storage the next connection asks to sign in again.
  }
};

export const clearVuuServerCredentials = (connectionId: string) => {
  try {
    sessionStorage.removeItem(storageKey(connectionId));
  } catch {
    // Nothing to clear.
  }
};

const readToken = async (response: Response) => {
  const header = response.headers.get("vuu-auth-token");
  if (header) {
    return header;
  }
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "token" in body &&
      typeof body.token === "string"
    ) {
      return body.token;
    }
  } catch {
    // No JSON body.
  }
  return undefined;
};

const parseUser = (token: string, username: string) => {
  try {
    return parseVuuUserFromToken(token);
  } catch {
    return { authorizations: [], name: username };
  }
};

/**
 * Logs in to a Vuu server with the username and password stored for it,
 * posting them to the server's login endpoint (`target.restUrl`).
 */
export const loginToVuuServer = async (
  target: VuuAuthTarget,
): Promise<VuuSession> => {
  const credentials = getVuuServerCredentials(target.connectionId);
  if (!credentials) {
    throw new VuuTokenExchangeError(
      `Sign in to ${target.connectionId} to connect`,
      undefined,
      "credentials-required",
    );
  }
  let response: Response;
  try {
    response = await fetch(target.restUrl, {
      body: JSON.stringify(credentials),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch (cause) {
    throw new VuuTokenExchangeError(
      `Unable to reach the login endpoint of ${target.connectionId}: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
      undefined,
      "service-unavailable",
    );
  }
  if (!response.ok) {
    throw new VuuTokenExchangeError(
      response.status === 401
        ? `${target.connectionId} rejected the username or password`
        : `Login to ${target.connectionId} failed (${response.status})`,
      response.status,
    );
  }
  const token = await readToken(response);
  if (!token) {
    throw new VuuTokenExchangeError(
      `Login to ${target.connectionId} returned no token`,
    );
  }
  const { authorizations, name } = parseUser(token, credentials.username);
  return { authorizations, token, user: { userName: name } };
};

/** True for a failure that signing in again could fix. */
export const isCredentialsFailure = (error: unknown) =>
  error instanceof VuuTokenExchangeError &&
  (error.failure === "credentials-required" ||
    error.failure === "authentication-rejected");
