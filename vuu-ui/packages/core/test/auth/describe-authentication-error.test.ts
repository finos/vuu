import { describe, expect, it } from "vitest";
import {
  AuthenticationConfigurationError,
  VuuConnectionError,
} from "../../src/auth/AuthenticationProvider";
import { describeAuthenticationError } from "../../src/auth/describe-authentication-error";
import { IdentityProviderUnavailableError } from "../../src/auth/KeycloakAuthHandler";
import {
  type VuuTokenExchangeFailure,
  VuuTokenExchangeError,
} from "../../src/auth/VuuTokenExchange";

const restUrl = "https://vuu.example.test/api/authn";

const connectionError = (failure: VuuTokenExchangeFailure) =>
  new VuuConnectionError(
    "portal",
    new VuuTokenExchangeError("failed", undefined, failure, { url: restUrl }),
  );

describe("describeAuthenticationError", () => {
  it("names the identity provider that can't be reached", () => {
    const description = describeAuthenticationError(
      new IdentityProviderUnavailableError("https://keycloak.example.test"),
    );
    expect(description).toMatchObject({
      title: "Can't reach the sign-in service",
      url: "https://keycloak.example.test",
    });
    expect(description.description).toContain("https://keycloak.example.test");
    expect(description.checks).toContain("Keycloak is running.");
  });

  it("names the Vuu server that can't be reached", () => {
    const description = describeAuthenticationError(
      connectionError("service-unavailable"),
    );
    expect(description).toMatchObject({
      title: "Can't reach the Vuu server",
      url: restUrl,
    });
    expect(description.description).toContain(restUrl);
  });

  it.each([
    ["authentication-rejected", "The Vuu server didn't accept your sign-in"],
    ["credentials-required", "The Vuu server didn't accept your sign-in"],
    ["authorization-denied", "You don't have access to this portal"],
    ["exchange-failed", "Couldn't connect to the Vuu server"],
  ] as const)("describes a %s Vuu failure", (failure, title) => {
    expect(describeAuthenticationError(connectionError(failure)).title).toBe(
      title,
    );
  });

  it("describes a configuration error with its message", () => {
    expect(
      describeAuthenticationError(
        new AuthenticationConfigurationError("authConfig.restUrl is required"),
      ),
    ).toMatchObject({
      description: "authConfig.restUrl is required",
      title: "The portal isn't configured correctly",
    });
  });

  it("falls back to a general sign-in failure", () => {
    expect(
      describeAuthenticationError(Error("Keycloak authentication failed"))
        .title,
    ).toBe("Sign-in failed");
  });
});
