import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const keycloak = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(true),
  logout: vi.fn().mockResolvedValue(undefined),
  token: "identity-token",
  tokenParsed: {
    email: "alice@example.test",
    family_name: "Smith",
    given_name: "Alice",
    preferred_username: "alice",
  },
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

const authConfig = {
  authUrl: "https://identity.example.test/",
  restUrl: "https://vuu.example.test/api/authn",
  websocketUrl: "wss://vuu.example.test/websocket",
};

describe("KeycloakAuthHandler", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes Keycloak once and refreshes the identity token", async () => {
    const { KeycloakAuthHandler } = await import(
      "../../src/auth/KeycloakAuthHandler"
    );
    const handler = new KeycloakAuthHandler({
      authUrl: "https://identity.example.test",
      restUrl: "https://vuu.example.test/api/authn",
      websocketUrl: "wss://vuu.example.test/websocket",
    });

    await expect(handler.authenticate()).resolves.toEqual({
      user: {
        email: "alice@example.test",
        firstName: "Alice",
        lastName: "Smith",
        userName: "alice",
      },
    });
    await expect(handler.authenticate()).resolves.toEqual({
      user: {
        email: "alice@example.test",
        firstName: "Alice",
        lastName: "Smith",
        userName: "alice",
      },
    });
    expect(keycloak.init).toHaveBeenCalledTimes(1);

    await expect(handler.getIdentityToken()).resolves.toBe("identity-token");
    expect(keycloak.updateToken).toHaveBeenCalledWith(-1);
  });

  it("coalesces concurrent forced token refreshes", async () => {
    let completeRefresh: (() => void) | undefined;
    keycloak.updateToken.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          completeRefresh = () => resolve(true);
        }),
    );
    const { KeycloakAuthHandler } = await import(
      "../../src/auth/KeycloakAuthHandler"
    );
    const handler = new KeycloakAuthHandler({
      authUrl: "https://identity.example.test",
      restUrl: "https://vuu.example.test/api/authn",
      websocketUrl: "wss://vuu.example.test/websocket",
    });

    const firstToken = handler.getIdentityToken();
    const secondToken = handler.getIdentityToken();

    expect(keycloak.updateToken).toHaveBeenCalledTimes(1);
    expect(keycloak.updateToken).toHaveBeenCalledWith(-1);

    completeRefresh?.();
    await expect(Promise.all([firstToken, secondToken])).resolves.toEqual([
      "identity-token",
      "identity-token",
    ]);
  });

  describe("when the identity provider can't be reached", () => {
    beforeEach(() => {
      vi.resetModules();
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    });

    it("reports the url without initializing Keycloak", async () => {
      const { IdentityProviderUnavailableError, KeycloakAuthHandler } =
        await import("../../src/auth/KeycloakAuthHandler");
      const handler = new KeycloakAuthHandler(authConfig);

      const error = await handler.authenticate().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(IdentityProviderUnavailableError);
      expect(error).toMatchObject({ url: "https://identity.example.test" });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://identity.example.test/realms/vuu/.well-known/openid-configuration",
        expect.objectContaining({ mode: "no-cors" }),
      );
      expect(keycloak.init).not.toHaveBeenCalled();
    });

    it("tries again on the next authenticate", async () => {
      const { KeycloakAuthHandler } = await import(
        "../../src/auth/KeycloakAuthHandler"
      );
      const handler = new KeycloakAuthHandler(authConfig);
      await expect(handler.authenticate()).rejects.toThrow();

      fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
      await expect(handler.authenticate()).resolves.toMatchObject({
        user: { userName: "alice" },
      });
      expect(keycloak.init).toHaveBeenCalledTimes(1);
    });
  });
});
