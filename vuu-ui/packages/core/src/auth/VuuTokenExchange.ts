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

type IdentityTokenDiagnostics = {
  expiresAt?: number;
  fingerprint: string;
  issuedAt?: number;
};

const createTokenFingerprint = (token: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const getIdentityTokenDiagnostics = (
  token: string,
): IdentityTokenDiagnostics => {
  const [, payload] = token.split(".");
  if (!payload || !/^[A-Za-z0-9_-]+$/.test(payload)) {
    return { fingerprint: createTokenFingerprint(token) };
  }

  const base64Payload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64Payload.length % 4)) % 4);
  try {
    const claims: unknown = JSON.parse(atob(`${base64Payload}${padding}`));
    if (claims === null || typeof claims !== "object") {
      return { fingerprint: createTokenFingerprint(token) };
    }
    const { exp, iat } = claims;
    return {
      expiresAt: typeof exp === "number" ? exp : undefined,
      fingerprint: createTokenFingerprint(token),
      issuedAt: typeof iat === "number" ? iat : undefined,
    };
  } catch {
    return { fingerprint: createTokenFingerprint(token) };
  }
};

export const exchangeVuuToken = async (
  identityToken: string,
  target: VuuAuthTarget,
): Promise<VuuSession> => {
  const identityTokenDiagnostics = getIdentityTokenDiagnostics(identityToken);
  console.info("[VuuTokenExchange] requesting token", {
    connectionId: target.connectionId,
    identityToken: identityTokenDiagnostics,
    restUrl: target.restUrl,
  });
  const response = await fetch(target.restUrl, {
    headers: { Authorization: `Bearer ${identityToken}` },
    method: "POST",
  });
  console.info("[VuuTokenExchange] token response", {
    connectionId: target.connectionId,
    status: response.status,
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
