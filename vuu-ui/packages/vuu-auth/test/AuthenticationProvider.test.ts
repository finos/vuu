import { describe, expect, it } from "vitest";
import {
  AuthenticationConfigurationError,
  normalizeVuuAuthTarget,
} from "../src/AuthenticationProvider";

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
});
