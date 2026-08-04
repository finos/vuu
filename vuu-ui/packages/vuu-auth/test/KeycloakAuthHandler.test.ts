import { beforeEach, describe, expect, it, vi } from "vitest";

const keycloak = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(true),
  logout: vi.fn().mockResolvedValue(undefined),
  token: "identity-token",
  tokenParsed: { preferred_username: "alice" },
  updateToken: vi.fn().mockResolvedValue(false),
}));

vi.mock("keycloak-js", () => ({
  default: class Keycloak {
    init = keycloak.init;
    logout = keycloak.logout;
    token = keycloak.token;
    tokenParsed = keycloak.tokenParsed;
    updateToken = keycloak.updateToken;
  },
}));

describe("KeycloakAuthHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes Keycloak once and refreshes the identity token", async () => {
    const { KeycloakAuthHandler } = await import("../src/KeycloakAuthHandler");
    const handler = new KeycloakAuthHandler({
      authUrl: "https://identity.example.test",
      restUrl: "https://vuu.example.test/api/authn",
      websocketUrl: "wss://vuu.example.test/websocket",
    });

    await expect(handler.authenticate()).resolves.toEqual({
      user: { userName: "alice" },
    });
    await expect(handler.authenticate()).resolves.toEqual({
      user: { userName: "alice" },
    });
    expect(keycloak.init).toHaveBeenCalledTimes(1);

    await expect(handler.getIdentityToken()).resolves.toBe("identity-token");
    expect(keycloak.updateToken).toHaveBeenCalledWith(30);
  });
});
