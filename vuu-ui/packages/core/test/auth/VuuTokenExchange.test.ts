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
      websocketUrl: "wss://localhost:8090/websocket",
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
});
