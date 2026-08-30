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

export class VuuTokenExchangeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VuuTokenExchangeError";
  }
}

export const exchangeVuuToken = async (
  identityToken: string,
  target: VuuAuthTarget,
): Promise<VuuSession> => {
  const response = await fetch(target.restUrl, {
    headers: { Authorization: `Bearer ${identityToken}` },
    method: 'POST'
  });
  if (!response.ok) {
    throw new VuuTokenExchangeError(
      `VUU token exchange failed for ${target.connectionId}`,
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
