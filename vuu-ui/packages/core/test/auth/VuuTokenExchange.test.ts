import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exchangeVuuToken,
  type VuuAuthTarget,
} from "../../src/auth/VuuTokenExchange";

const target: VuuAuthTarget = {
  connectionId: "orders",
  restUrl: "https://orders.example.test/api/authn",
  websocketUrl: "wss://orders.example.test/websocket",
};

const token = `${btoa(
  JSON.stringify({ authorizations: ["orders.read"], name: "alice" }),
)}.signature`;

describe("exchangeVuuToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exchanges an identity token for a parsed VUU session", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(exchangeVuuToken("identity-token", target)).resolves.toEqual({
      authorizations: ["orders.read"],
      token,
      user: { userName: "alice" },
    });
    expect(fetch).toHaveBeenCalledWith(target.restUrl, {
      headers: { Authorization: "Bearer identity-token" },
      method: "POST",
    });
  });

  it.each([
    [401, "authentication-rejected", "token exchange rejected"],
    [403, "authorization-denied", "authorization denied"],
    [503, "service-unavailable", "token exchange unavailable"],
  ] as const)("distinguishes a %i response as %s", async (status, failure, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status })),
    );

    const exchange = exchangeVuuToken("identity-token", target);
    await expect(exchange).rejects.toMatchObject({
      failure,
      name: "VuuTokenExchangeError",
      status,
    });
    await expect(exchange).rejects.toThrow(message);
  });

  it("forwards a profile-specific authentication endpoint", async () => {
    const moduleAdminTarget = {
      connectionId: "module-admin",
      restUrl: "https://localhost:8443/api/authn/module-admin",
      websocketUrl: "wss://localhost:8091/websocket-portal",
    };
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    await exchangeVuuToken("identity-token", moduleAdminTarget);

    expect(fetch).toHaveBeenCalledWith(
      "https://localhost:8443/api/authn/module-admin",
      expect.any(Object),
    );
  });

  it("logs connection-scoped, non-sensitive identity token diagnostics", async () => {
    const encodeBase64Url = (value: object) =>
      btoa(JSON.stringify(value))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const identityToken = [
      encodeBase64Url({ alg: "none", typ: "JWT" }),
      encodeBase64Url({ exp: 1_800_000_000, iat: 1_700_000_000 }),
      "signature",
    ].join(".");
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetch);

    await exchangeVuuToken(identityToken, target);

    expect(info).toHaveBeenCalledWith("[VuuTokenExchange] requesting token", {
      connectionId: target.connectionId,
      identityToken: {
        expiresAt: 1_800_000_000,
        fingerprint: expect.stringMatching(/^fnv1a-[a-f0-9]{8}$/),
        issuedAt: 1_700_000_000,
      },
      restUrl: target.restUrl,
    });
    expect(info).toHaveBeenCalledWith("[VuuTokenExchange] token response", {
      connectionId: target.connectionId,
      status: 200,
    });
    expect(JSON.stringify(info.mock.calls)).not.toContain(identityToken);
  });
});
