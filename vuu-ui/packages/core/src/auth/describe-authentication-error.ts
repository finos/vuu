import {
  AuthenticationConfigurationError,
  VuuConnectionError,
} from "./AuthenticationProvider";
import { IdentityProviderUnavailableError } from "./KeycloakAuthHandler";
import { VuuTokenExchangeError } from "./VuuTokenExchange";

export interface AuthenticationErrorDescription {
  /** Short statement of what went wrong. */
  title: string;
  /** One or two sentences explaining the failure. */
  description: string;
  /** Things the user or an administrator can check. */
  checks: string[];
  /** The server that could not be reached or rejected the request. */
  url?: string;
}

const asVuuFailure = (error: Error) => {
  if (error instanceof VuuConnectionError) {
    return { failure: error.failure, url: error.url };
  }
  if (error instanceof VuuTokenExchangeError) {
    return { failure: error.failure, url: error.url };
  }
};

/**
 * Describes an error raised while the portal starts up and authenticates, in
 * terms a user can act on.
 */
export const describeAuthenticationError = (
  error: Error,
): AuthenticationErrorDescription => {
  if (error instanceof IdentityProviderUnavailableError) {
    return {
      title: "Can't reach the sign-in service",
      description: `The portal couldn't connect to the identity provider (Keycloak) at ${error.url}.`,
      checks: [
        "Keycloak is running.",
        "The browser trusts Keycloak's certificate. Open its address in a new tab to check.",
        "authUrl in the portal's config.json is correct.",
      ],
      url: error.url,
    };
  }

  if (error instanceof AuthenticationConfigurationError) {
    return {
      title: "The portal isn't configured correctly",
      description: error.message,
      checks: ["The portal's authentication settings."],
    };
  }

  const vuuFailure = asVuuFailure(error);
  if (vuuFailure) {
    const { failure, url } = vuuFailure;
    switch (failure) {
      case "service-unavailable":
        return {
          title: "Can't reach the Vuu server",
          description: url
            ? `You're signed in, but the portal couldn't connect to the Vuu server's authentication service at ${url}.`
            : "You're signed in, but the portal couldn't connect to the Vuu server.",
          checks: [
            "The Vuu server is running.",
            "The browser trusts the Vuu server's certificate.",
            "restUrl in the portal's config.json is correct.",
          ],
          url,
        };
      case "authentication-rejected":
      case "credentials-required":
        return {
          title: "The Vuu server didn't accept your sign-in",
          description:
            "You're signed in, but the Vuu server rejected your identity token.",
          checks: [
            "The Vuu server and Keycloak are configured for the same realm.",
            "Signing out and in again.",
          ],
          url,
        };
      case "authorization-denied":
        return {
          title: "You don't have access to this portal",
          description:
            "You're signed in, but your account isn't permitted to use the portal.",
          checks: ["Ask an administrator to grant you access."],
          url,
        };
      default:
        return {
          title: "Couldn't connect to the Vuu server",
          description:
            "You're signed in, but connecting to the Vuu server failed.",
          checks: ["The Vuu server is running and its logs."],
          url,
        };
    }
  }

  return {
    title: "Sign-in failed",
    description: "The portal couldn't sign you in.",
    checks: [
      "Keycloak and the Vuu server are running.",
      "The technical details below.",
    ],
  };
};
