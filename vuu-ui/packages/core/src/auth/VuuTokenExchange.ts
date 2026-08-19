import type { User } from "./AuthHandler";
import type { VuuModuleRegistry } from "@vuu-ui/vuu-protocol-types";
import { parseVuuUserFromToken } from "./VuuUser";

export interface VuuAuthTarget {
  connectionId: string;
  restUrl: string;
  websocketUrl: string;
}

export interface VuuSession {
  authorizations: string[];
  moduleRegistry?: VuuModuleRegistry;
  token: string;
  user: User;
}

export type VuuTokenExchangeFailure =
  | "authentication-rejected"
  | "authorization-denied"
  | "service-unavailable"
  | "exchange-failed";

const getFailure = (status?: number): VuuTokenExchangeFailure => {
  switch (status) {
    case 401:
      return "authentication-rejected";
    case 403:
      return "authorization-denied";
    case 503:
      return "service-unavailable";
    default:
      return "exchange-failed";
  }
};

const getFailureMessage = (target: VuuAuthTarget, status: number) => {
  switch (status) {
    case 401:
      return `VUU token exchange rejected for ${target.connectionId} (401)`;
    case 403:
      return `VUU authorization denied for ${target.connectionId} (403)`;
    case 503:
      return `VUU token exchange unavailable for ${target.connectionId} (503)`;
    default:
      return `VUU token exchange failed for ${target.connectionId} (${status})`;
  }
};

export class VuuTokenExchangeError extends Error {
  readonly failure: VuuTokenExchangeFailure;

  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VuuTokenExchangeError";
    this.failure = getFailure(status);
  }
}

export const exchangeVuuToken = async (
  identityToken: string,
  target: VuuAuthTarget,
): Promise<VuuSession> => {
  const response = await fetch(target.restUrl, {
    headers: { Authorization: `Bearer ${identityToken}` },
    method: "POST",
  });
  if (!response.ok) {
    throw new VuuTokenExchangeError(
      getFailureMessage(target, response.status),
      response.status,
    );
  }

  const result: unknown = await response.json();
  if (
    result === null ||
    typeof result !== "object" ||
    !("token" in result) ||
    typeof result.token !== "string"
  ) {
    throw new VuuTokenExchangeError(
      `VUU token exchange returned no token for ${target.connectionId}`,
    );
  }

  const { authorizations, name } = parseVuuUserFromToken(result.token);
  return {
    authorizations,
    token: result.token,
    user: { userName: name },
  };
};
