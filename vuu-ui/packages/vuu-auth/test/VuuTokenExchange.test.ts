import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exchangeVuuToken,
  VuuTokenExchangeError,
  type VuuAuthTarget,
} from "../src/VuuTokenExchange";

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
    });
  });

  it("surfaces the failed endpoint and response status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(exchangeVuuToken("expired", target)).rejects.toEqual(
      new VuuTokenExchangeError("VUU token exchange failed for orders", 401),
    );
  });
});
