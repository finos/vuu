import { afterEach, describe, expect, it } from "vitest";
import { DirectVuuSessionResolver } from "../../src/connection-management/DirectVuuSessionResolver";
import { VuuAuthHandler } from "../../src/auth/VuuAuthHandler";

const config = {
  authUrl: "https://login.example.test",
  restUrl: "https://vuu.example.test/api/authn",
  websocketUrl: "wss://vuu.example.test/websocket",
};

const token = `${btoa(
  JSON.stringify({ authorizations: ["orders.read"], name: "alice" }),
)}.signature`;

describe("VuuAuthHandler", () => {
  afterEach(() => {
    history.replaceState(null, "", "/");
    sessionStorage.clear();
  });

  it("uses the VUU token returned by the simple login service", async () => {
    history.replaceState(null, "", `/?token=${encodeURIComponent(token)}`);
    const handler = new VuuAuthHandler(config);

    await expect(handler.authenticate()).resolves.toEqual({
      user: { userName: "alice" },
    });
    const resolver = new DirectVuuSessionResolver();
    await expect(
      resolver.resolve(handler, {
        connectionId: "portal",
        restUrl: config.restUrl,
        websocketUrl: config.websocketUrl,
      }),
    ).resolves.toEqual({
      authorizations: ["orders.read"],
      token,
      user: { userName: "alice" },
    });
    expect(location.search).toBe("");
  });
});
