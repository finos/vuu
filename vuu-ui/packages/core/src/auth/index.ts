export type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
export type { AuthConfig } from "./AuthConfig";
export {
  AuthenticationErrorBoundary,
  type AuthenticationErrorBoundaryProps
} from "./AuthenticationErrorBoundary";
export {
  AuthenticationConfigurationError, AuthenticationProvider, normalizeVuuAuthTarget, useAuthenticatedUser,
  useIdentityToken,
  useModuleRegistry,
  useLogout,
  useOptionalVuuConnectionId,
  usePortalVuuAuthTarget,
  useVuuAccessToken,
  useVuuConnectionId, VuuConnectionError, type AuthenticationErrorHandler,
  type AuthenticationProviderProps,
  type IdentityAuthenticationProps, type VuuConnectionAuthenticationProps
} from "./AuthenticationProvider";
export type {
  AuthenticatedIdentity,
  AuthHandler,
  AuthHandlerClass,
  User
} from "./AuthHandler";
export { KeycloakAuthHandler } from "./KeycloakAuthHandler";
export { VuuAuthHandler } from './VuuAuthHandler';
export {
  authenticateWithUsernamePassword,
  VuuLoginHandler
} from "./VuuLoginHandler";
export {
  exchangeVuuToken, VuuTokenExchangeError, type VuuAuthTarget,
  type VuuTokenExchangeFailure,
  type VuuSession
} from "./VuuTokenExchange";
export {
  parseVuuUserFromToken,
  type VuuUser
} from "./VuuUser";
