export type { AuthConfig } from "./AuthConfig";
export type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
export {
  AuthenticationErrorBoundary,
  type AuthenticationErrorBoundaryProps,
} from "./AuthenticationErrorBoundary";
export type {
  AuthenticatedIdentity,
  AuthHandler,
  AuthHandlerClass,
  User,
} from "./AuthHandler";
export {
  AuthenticationProvider,
  AuthenticationConfigurationError,
  type AuthenticationErrorHandler,
  type AuthenticationProviderProps,
  type IdentityAuthenticationProps,
  normalizeVuuAuthTarget,
  VuuConnectionError,
  type VuuConnectionAuthenticationProps,
  useAuthenticatedUser,
  useIdentityToken,
  useLogout,
  useOptionalVuuConnectionId,
  useVuuAccessToken,
  useVuuConnectionId,
} from "./AuthenticationProvider";
export { KeycloakAuthHandler } from "./KeycloakAuthHandler";
export {
  authenticateWithUsernamePassword,
  VuuLoginHandler,
} from "./VuuLoginHandler";
export {
  exchangeVuuToken,
  type VuuAuthTarget,
  type VuuSession,
  VuuTokenExchangeError,
} from "./VuuTokenExchange";
export {
  VuuConnectionRegistry,
  type VuuConnectionRegistryOptions,
  vuuConnectionRegistry,
} from "./VuuConnectionRegistry";
export {
  parseVuuUserFromToken,
  type VuuUser,
} from "./VuuUser";
