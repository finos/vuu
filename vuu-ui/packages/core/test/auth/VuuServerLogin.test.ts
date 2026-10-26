import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthHandler } from "../../src/auth/AuthHandler";
import {
  clearVuuServerCredentials,
  getVuuServerCredentials,
  loginToVuuServer,
  setVuuServerCredentials,
} from "../../src/auth/VuuServerLogin";
import type { VuuAuthTarget } from "../../src/auth/VuuTokenExchange";
import { IdentityTokenSessionResolver } from "../../src/connection-management/VuuSessionResolver";

const target: VuuAuthTarget = {
  auth: "vuu-login",
  connectionId: "scala",
  restUrl: "https://scala.example.test/api/authn",
  websocketUrl: "wss://scala.example.test/websocket",
};

const vuuToken = (name: string) =>
  `${btoa(JSON.stringify({ authorizations: ["a"], name }))}.signature`;

describe("loginToVuuServer", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    clearVuuServerCredentials("scala");
  });

  it("asks for credentials when none are stored", async () => {
    await expect(loginToVuuServer(target)).rejects.toMatchObject({
      failure: "credentials-required",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the stored username and password and returns the Vuu session", async () => {
    setVuuServerCredentials("scala", { password: "pw", username: "steve" });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: vuuToken("steve") }), {
        status: 200,
      }),
    );
    await expect(loginToVuuServer(target)).resolves.toEqual({
      authorizations: ["a"],
      token: vuuToken("steve"),
      user: { userName: "steve" },
    });
    expect(fetchMock).toHaveBeenCalledWith(target.restUrl, {
      body: JSON.stringify({ password: "pw", username: "steve" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });

  it("reports rejected credentials", async () => {
    setVuuServerCredentials("scala", { password: "x", username: "steve" });
    fetchMock.mockResolvedValue(new Response("nope", { status: 401 }));
    await expect(loginToVuuServer(target)).rejects.toMatchObject({
      failure: "authentication-rejected",
    });
  });

  it("keeps credentials per server until cleared", () => {
    setVuuServerCredentials("scala", { password: "pw", username: "steve" });
    expect(getVuuServerCredentials("scala")).toEqual({
      password: "pw",
      username: "steve",
    });
    clearVuuServerCredentials("scala");
    expect(getVuuServerCredentials("scala")).toBeUndefined();
  });
});

describe("IdentityTokenSessionResolver", () => {
  const authHandler: AuthHandler = {
    authenticate: vi.fn(),
    getIdentityToken: vi.fn(async () => "identity"),
    logout: vi.fn(),
  };

  it("logs in to vuu-login servers without the portal identity", async () => {
    const exchange = vi.fn();
    const login = vi.fn(async () => ({
      authorizations: [],
      token: "t",
      user: { userName: "u" },
    }));
    const resolver = new IdentityTokenSessionResolver(exchange, login);
    await resolver.resolve(authHandler, target);
    expect(login).toHaveBeenCalledWith(target);
    expect(exchange).not.toHaveBeenCalled();
    expect(authHandler.getIdentityToken).not.toHaveBeenCalled();
  });

  it("exchanges the identity token for other servers", async () => {
    const exchange = vi.fn();
    const login = vi.fn();
    const resolver = new IdentityTokenSessionResolver(exchange, login);
    const { auth: _auth, ...tokenTarget } = target;
    await resolver.resolve(authHandler, tokenTarget);
    expect(exchange).toHaveBeenCalledWith("identity", tokenTarget);
    expect(login).not.toHaveBeenCalled();
  });
});
