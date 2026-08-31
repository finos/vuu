import { describe, expect, it } from "vitest";
import {
  AuthenticationConfigurationError,
  normalizeVuuAuthTarget,
  VuuConnectionError,
} from "../../src/auth/AuthenticationProvider";
import { VuuTokenExchangeError } from "../../src/auth/VuuTokenExchange";

const portalTarget = {
  connectionId: "portal",
  restUrl: "https://portal.example.test/api/authn",
  websocketUrl: "wss://portal.example.test/websocket",
};

describe("normalizeVuuAuthTarget", () => {
  it("inherits portal endpoints only for the portal connection", () => {
    expect(
      normalizeVuuAuthTarget({ connectionId: "portal" }, portalTarget),
    ).toEqual(portalTarget);
  });

  it("requires explicit endpoints for a non-portal connection", () => {
    expect(() =>
      normalizeVuuAuthTarget({ connectionId: "orders" }, portalTarget),
    ).toThrow(
      new AuthenticationConfigurationError(
        "Connection orders must define restUrl and websocketUrl",
      ),
    );
  });

  it.each([
    {
      connectionId: "user-admin",
      restUrl: "https://localhost:8444/api/authn",
      websocketUrl: "wss://localhost:8092/websocket",
    },
    {
      connectionId: "basket-trading",
      restUrl: "https://localhost:8445/api/authn",
      websocketUrl: "wss://localhost:8093/websocket",
    },
  ])("preserves registry endpoints for $connectionId", (connection) => {
    expect(normalizeVuuAuthTarget(connection, portalTarget)).toEqual(
      connection,
    );
  });

  it("preserves typed authorization denial details for a remote connection", () => {
    const cause = new VuuTokenExchangeError(
      "VUU authorization denied for module-admin (403)",
      403,
    );

    expect(new VuuConnectionError("module-admin", cause)).toMatchObject({
      connectionId: "module-admin",
      failure: "authorization-denied",
      message:
        "VUU connection authentication failed for module-admin: VUU authorization denied for module-admin (403)",
      status: 403,
    });
  });
});
