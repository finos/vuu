# Keycloak Remote Authorization by Token Exchange

## Status

Draft proposal.

## Purpose

This document proposes separating:

1. portal navigation entitlement, which controls whether a remote appears in the
   portal menu; and
2. remote authorization, which controls what the user can do after opening that
   remote.

The portal access token must not grant remote-specific permissions. A remote VUU
server obtains those permissions only when the user opens the remote, by
exchanging the user's portal access token for a token scoped to that remote's
Keycloak client.

## Goals

- Define one portal-owned login role per remote.
- Build the module registry and portal menu from portal login roles.
- Keep remote view, edit, trade, and administration roles in remote-specific
  Keycloak clients.
- Exchange tokens only on trusted VUU servers. Client secrets never enter the
  browser.
- Preserve the user's identity during exchange.
- Prevent roles belonging to other clients, realm roles, or groups from leaking
  into a remote VUU session.
- Continue issuing short-lived VUU tokens for WebSocket login rather than
  returning exchanged Keycloak tokens to the browser.
- Support multiple remote VUU connections without repeating interactive
  Keycloak login.

## Non-goals

- Portal login roles are not authorization to invoke remote APIs.
- Token exchange must not grant roles the user does not already possess.
- This proposal does not replace VUU module permission checks.
- This proposal does not send confidential client credentials to the browser.

## Keycloak client model

### Public browser client

`vuu-portal` remains the public OIDC client used by the portal UI.

It owns navigation roles only:

- `module-admin-login`
- `user-admin-login`
- `basket-trading-login`

These roles mean that the user may discover and attempt to open a remote. They
do not imply any permission within that remote.

### Confidential resource clients

Each independently authorized remote has a confidential client representing its
security boundary:

| Client | Example roles |
| --- | --- |
| `vuu-portal-server` | Portal-only server permissions, if required |
| `vuu-module-admin-server` | `module-admin-view`, `module-admin-edit` |
| `vuu-user-admin-server` | `user-admin-view`, `user-admin-edit` |
| `vuu-basket-trading-server` | `basket-trading-view`, `basket-trading-trade` |

A confidential client represents an authorization target. It does not have to
map one-to-one to an operating-system process. This distinction matters for
`module-admin`, which currently shares the portal VUU server process.

## Required Keycloak token shape

The access token issued to the public `vuu-portal` client should contain:

- the user's portal login roles under
  `resource_access.vuu-portal.roles`; and
- each confidential VUU client in `aud`, so that those clients are eligible to
  exchange the token using Keycloak standard token exchange.

An audience entry is not a permission. Remote permissions must not be copied
into the portal token.

For example:

```json
{
  "azp": "vuu-portal",
  "aud": [
    "vuu-portal-server",
    "vuu-module-admin-server",
    "vuu-user-admin-server",
    "vuu-basket-trading-server"
  ],
  "resource_access": {
    "vuu-portal": {
      "roles": ["user-admin-login", "basket-trading-login"]
    }
  }
}
```

After exchange by the user-admin VUU server, the resulting token should contain
only the user-admin audience and roles:

```json
{
  "azp": "vuu-user-admin-server",
  "aud": ["vuu-user-admin-server"],
  "resource_access": {
    "vuu-user-admin-server": {
      "roles": ["user-admin-view", "user-admin-edit"]
    }
  }
}
```

The exact `azp` emitted by the deployed Keycloak version must be confirmed by an
integration test. Audience and target-client role isolation are mandatory even
if `azp` validation is made configurable.

## End-to-end flow

### Portal login and module discovery

1. `KeycloakAuthHandler` signs the user into the public `vuu-portal` client.
2. The browser sends that access token to the portal VUU server's
   `POST /api/authn` endpoint.
3. The portal authentication profile validates the token and reads only
   `resource_access.vuu-portal.roles`.
4. The portal server issues a VUU token containing the portal login roles.
5. The browser opens the portal WebSocket with that VUU token.
6. `ModuleRegistry.selectModules()` compares each module's login permission with
   the portal login roles.
7. `LOGIN_SUCCESS.moduleRegistry` contains only remotes the user may attempt to
   open.

The portal must not use `user-admin-view`, `basket-trading-trade`, or any other
remote role to build the registry.

### Opening a remote

1. The user selects a visible remote.
2. `RemoteModule` acquires the remote's VUU connection through
   `VuuConnectionRegistry`.
3. `KeycloakAuthHandler.getIdentityToken()` refreshes and returns the user's
   current `vuu-portal` access token.
4. `exchangeVuuToken()` sends that token as a bearer token to the remote's
   configured `restUrl`.
5. The remote VUU server authenticates as its confidential Keycloak client and
   exchanges the incoming user token.
6. Keycloak returns a token for the same user, restricted to the remote
   audience and the user's roles in that remote client.
7. The VUU server validates the exchanged token and creates a `VuuUser` from
   only the target client's roles.
8. `LoginTokenService` issues a VUU token containing those authorizations.
9. The browser uses the VUU token to open the remote WebSocket.
10. VUU modules and RPC handlers enforce the remote authorizations.

The browser never receives the exchanged Keycloak token.

## Token exchange request

The remote server sends a confidential request to the realm token endpoint:

```http
POST /realms/vuu/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <remote-client-credentials>
```

```text
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
subject_token=<user-vuu-portal-access-token>
subject_token_type=urn:ietf:params:oauth:token-type:access_token
requested_token_type=urn:ietf:params:oauth:token-type:access_token
audience=vuu-user-admin-server
```

Keycloak must reject the request if:

- the requesting confidential client is not an audience of the subject token;
- the requested audience is unavailable to the requesting client;
- the subject token is invalid or expired; or
- the requesting client is not permitted to use standard token exchange.

## Shared portal server and `module-admin`

`module-admin` currently uses the portal VUU server and the existing `portal`
connection. Reusing that authenticated connection cannot provide on-demand
module-admin authorization: the connection and its VUU token already exist
before the user opens the remote.

The recommended solution is a separate logical authentication profile:

| Setting | Portal session | Module-admin session |
| --- | --- | --- |
| Connection ID | `portal` | `module-admin` |
| REST endpoint | `/api/authn` | `/api/authn/module-admin` |
| WebSocket endpoint | Portal WebSocket | Same portal WebSocket |
| Keycloak role source | `vuu-portal` | `vuu-module-admin-server` |
| Purpose | Registry and portal data | Module-admin operations |

This creates a second logical VUU connection to the same server process. The
module-admin endpoint performs exchange for `vuu-module-admin-server`, and the
resulting VUU token contains only module-admin permissions.

An alternative is a standalone module-admin VUU server. That is operationally
simpler but introduces another process. Keeping module-admin on the portal
process requires the named authentication-profile support described below.

## Changes in `vuu-websocket`

### Keycloak client configuration

Update `scripts/keycloak-client-config.ts` to define clients declaratively:

```ts
type ManagedClient = {
  clientId: string;
  kind: "public-browser" | "confidential-resource";
  roles: string[];
};
```

The managed set should include:

- `vuu-portal`
- `vuu-portal-server`
- `vuu-module-admin-server`
- `vuu-user-admin-server`
- `vuu-basket-trading-server`

Define portal login roles separately from resource roles. Avoid deriving one
kind from the other by naming convention.

### Realm and client bootstrap

Update `scripts/keycloak-realm-client.ts`:

1. Keep `vuu-portal` public with standard authorization-code flow and PKCE.
2. Create or update every confidential resource client.
3. Set `attributes["standard.token.exchange.enabled"] = "true"` on each
   confidential client.
4. Set `fullScopeAllowed=false` on each confidential resource client.
5. Add an idempotent self-audience mapper to each confidential client so an
   exchange with `audience=<same-client-id>` can mint a token for that audience.
6. Keep audience mappers that add each confidential VUU client to tokens issued
   to `vuu-portal`. These audiences establish exchange eligibility and must not
   be interpreted as permissions.
7. Reconcile managed mappers exactly: add missing definitions, update changed
   definitions, and remove retired managed definitions while preserving
   unrelated administrator-managed mappers.
8. Continue removing retired clients only through an explicit managed-retirement
   list.

Relevant existing functions include:

- `ensureServerClient()`
- `ensureStandardTokenExchangeEnabled()`
- `lookupClientByClientId()`
- `fetchClientSecret()`
- `reconcileServerAudienceMappers()`
- `removeClientIfPresent()`

The bootstrap must be idempotent and safe to run against realms created before
the portal/user-admin refactor.

### Role and user bootstrap

Update `scripts/keycloak-users.ts`:

1. Add the three login roles to `vuu-portal`.
2. Move or rename remote permissions into their confidential resource clients.
3. Replace additive `ensureTokenClientRoleScopes()` behavior with exact
   reconciliation for managed role scopes.
4. Scope each confidential resource client to only its own client roles.
5. Remove stale managed cross-client scope mappings.
6. Preserve unrelated administrator-managed mappings.
7. Assign portal login roles and remote permissions independently.

Example group mappings:

| Group | Portal login role | Resource roles |
| --- | --- | --- |
| `MODULES_VIEW` | `module-admin-login` | `module-admin-view` |
| `MODULES_ADMIN` | `module-admin-login` | `module-admin-view`, `module-admin-edit` |
| `USERS_VIEW` | `user-admin-login` | `user-admin-view` |
| `USERS_ADMIN` | `user-admin-login` | `user-admin-view`, `user-admin-edit` |
| `BASKET_VIEW` | `basket-trading-login` | `basket-trading-view` |
| `BASKET_TRADE` | `basket-trading-login` | `basket-trading-view`, `basket-trading-trade` |

The table shows convenient defaults, not a required coupling. An administrator
may assign `user-admin-login` without assigning `user-admin-view`; the menu will
then be visible, but remote authentication must return an authenticated,
unauthorized result.

### Secrets and environment configuration

Checked-in configuration must not contain production client secrets.

Add consistent environment overrides for:

- `VUU_PORTAL_SERVER_CLIENT_SECRET`
- `VUU_MODULE_ADMIN_SERVER_CLIENT_SECRET`
- `VUU_USER_ADMIN_SERVER_CLIENT_SECRET`
- `VUU_BASKET_TRADING_SERVER_CLIENT_SECRET`

The Keycloak bootstrap and each VUU application must read the same source of
truth. Local development may use documented deterministic defaults, but
production must require externally supplied secrets.

Keycloak Admin API credentials used by `KeycloakAdminClient` remain separate
from token-exchange client credentials.

### VUU server auth configuration

For each remote authentication profile:

```hocon
vuu.auth.keycloak {
  clientId = "vuu-user-admin-server"
  audience = "vuu-user-admin-server"
  audiencePolicy = "always-exchange"
  tokenExchangeEnabled = true
}
```

Apply `always-exchange` to remote profiles even though the incoming portal token
already contains the target in `aud`. `exchange-if-needed` would otherwise skip
exchange and retain the broad subject-token claim set.

Relevant files are:

- `packages/vuu-portal/application.conf`
- `packages/vuu-user-admin/application.conf`
- `packages/vuu-basket-trading/application.conf`

The portal application additionally needs a module-admin authentication profile
for `vuu-module-admin-server`.

### `/api/authn` routing

`createAuthHttpHandler()` in
`packages/vuu-server/src/net/auth/AuthHttpHandler.ts` currently handles a single
`POST /api/authn` configuration.

Add explicit authentication profiles without allowing the caller to provide an
arbitrary audience:

```ts
type AuthProfile = {
  path: string;
  provider: AuthProvider;
  loginTokenService: LoginTokenService;
};
```

The application supplies a fixed path-to-provider map. For example:

```text
/api/authn              -> portal navigation profile
/api/authn/module-admin -> vuu-module-admin-server exchange profile
```

Standalone servers still expose only `/api/authn`.

Do not accept `audience`, `clientId`, or a client-secret selector from query
parameters or the request body. The server configuration owns the target.

### `KeycloakAuthProvider`

Update
`packages/vuu-server/src/net/auth/KeycloakAuthProvider.ts`:

1. For remote profiles, exchange every valid subject token.
2. Send the configured client ID, client secret, and audience in the RFC 8693
   request.
3. Introspect or cryptographically validate the exchanged token.
4. Require the exchanged token to identify the same user as the subject token.
5. Require the configured audience.
6. Validate the expected authorized party when supported by the deployed
   Keycloak version.
7. Derive authorizations only from:

   ```ts
   payload.resource_access?.[configuredAuthorizationClientId]?.roles ?? []
   ```

8. Never flatten realm roles, group names, or roles from all
   `resource_access` entries.
9. Use the exchanged token's expiry when creating the VUU user/session.
10. Remove token and audience debug logging.

Portal navigation authentication is the deliberate exception: it reads only
`resource_access.vuu-portal.roles` from the validated subject token. Model this
as an explicit profile setting such as `authorizationClientId`, not as broad
claim flattening.

The provider should return a typed authentication result that makes the token
source and authorization client explicit:

```ts
type KeycloakAuthenticationResult = {
  authorizationClientId: string;
  authorizations: string[];
  expiresAt: number;
  subject: string;
  userName: string;
};
```

### VUU token issuance

`LoginTokenServiceImpl.getToken()` in
`packages/vuu-server/src/net/auth/LoginTokenService.ts` can continue signing an
in-memory VUU token and returning `{ "token": "..." }`.

The issued VUU token must contain only the authorizations returned by the
selected authentication profile. It must not retain the exchanged Keycloak
token or the original browser token.

WebSocket login continues to validate:

- signature;
- server-local token membership;
- expiry; and
- the resulting `VuuUser`.

### Application assembly

Update provider assembly in:

- `packages/vuu-server/src/net/auth/ConfiguredAuthProviders.ts`
- `packages/vuu-server/src/core/VuuServerApplication.ts`
- `packages/vuu-portal/src/PortalMain.ts`
- `packages/vuu-user-admin/src/UserAdminMain.ts`
- `packages/vuu-basket-trading/src/BasketTradingMain.ts`

The portal application registers two profiles: portal navigation and
module-admin. Standalone applications register one fixed remote profile.

### Portal module registry

Update permission rows in
`packages/vuu-portal/src/modules/ModuleDiscovery/ModuleDiscoveryModule.ts`:

| Module | Required portal role |
| --- | --- |
| `moduleAdmin` | `module-admin-login` |
| `userAdmin` | `user-admin-login` |
| `basketTrading` | `basket-trading-login` |

`createModuleRegistry()` and `selectModules()` in
`packages/vuu-portal/src/ModuleRegistry.ts` can retain exact authorization
membership checks.

Remote permissions such as `user-admin-view` must no longer influence module
registry selection.

## Changes in `finos/vuu`

Most client behavior already matches the design:

- `KeycloakAuthHandler.getIdentityToken()` refreshes the portal access token.
- `VuuTokenExchange.exchangeVuuToken()` sends it to the configured VUU
  `restUrl`.
- `VuuConnectionRegistry` creates one authenticated VUU session per
  `connectionId`.
- `AuthenticationProvider` gives remotes a connection-scoped data source.

Required changes are:

1. Change the module-admin registry record from `connectionId: "portal"` to
   `connectionId: "module-admin"`.
2. Set module-admin `restUrl` to the portal server's fixed module-admin auth
   profile, for example `https://localhost:8443/api/authn/module-admin`.
3. Set module-admin `websocketUrl` to the portal server WebSocket.
4. Keep user-admin and basket-trading on their standalone connection IDs and
   endpoints.
5. Present `403 Forbidden` as an authorization failure when exchange succeeds
   but the resulting target role set does not permit the remote's baseline
   operation.
6. Do not inspect Keycloak remote roles in the browser.

No client secret or direct Keycloak token-exchange request is added to the UI.

## Error semantics

| Condition | Result |
| --- | --- |
| Missing, invalid, or expired subject token | `401 Unauthorized` |
| Confidential-client authentication failure | `503 Service Unavailable` or fail-closed `401`, consistently configured |
| Keycloak exchange unavailable | `503 Service Unavailable` |
| Exchange denied by policy or audience | `401 Unauthorized` |
| Valid exchanged identity with no required remote permission | `403 Forbidden` |
| Valid remote permissions | `200 OK` with VUU token |

Do not turn token-exchange failures into an empty successful authorization set.

## Tests

### Keycloak bootstrap tests

Extend `scripts/__tests__/keycloak-client-config.test.ts` to cover:

- public portal login roles;
- confidential client creation and updates;
- token exchange enabled on all resource clients;
- self-audience mapper creation;
- portal-to-server audience mapper creation;
- `fullScopeAllowed=false`;
- exact managed role-scope reconciliation;
- stale managed mapping removal;
- unrelated mapper and scope preservation;
- retired-client cleanup; and
- idempotent repeated bootstrap.

### `KeycloakAuthProvider` tests

Extend `packages/vuu-server/__tests__/KeycloakAuthProvider.test.ts`:

- `always-exchange` exchanges even when the subject already has the target
  audience;
- the exchange request contains the exact RFC 8693 fields;
- wrong or missing exchanged audience is rejected;
- changed subject identity is rejected;
- wrong authorized party is rejected when enforced;
- no target roles produces an empty authorization list;
- target-client roles are retained;
- realm, group, and cross-client roles are excluded;
- Keycloak 4xx and 5xx responses remain distinguishable; and
- secrets and tokens are absent from logs and errors.

### HTTP and VUU token tests

Extend `packages/vuu-server/__tests__/AuthnHttpHandler.test.ts`:

- each fixed path selects only its configured profile;
- unknown profiles return `404`;
- callers cannot override audience/client ID;
- CORS preflight remains correct;
- the returned VUU token contains only target roles; and
- that VUU token is accepted by WebSocket login through the same
  `LoginTokenService`.

### Portal registry tests

Update `packages/vuu-portal/__tests__/ModuleRegistry.test.ts`:

- each `*-login` role reveals only its corresponding module;
- remote `*-view` or `*-edit` roles alone do not reveal modules;
- disabled, unauthorized, and superseded module records remain excluded; and
- module-admin uses its separate logical connection.

### UI tests

Update the `@vuu-ui/core` authentication and connection tests:

- selecting module-admin resolves its profile-specific REST URL;
- multiple remotes reuse the refreshed portal identity token but receive
  different VUU tokens;
- a remote `403` does not terminate the portal or other VUU connections; and
- reconnect performs a fresh exchange for the same target.

### Real-Keycloak integration test

Add an opt-in integration script that, for each remote:

1. obtains a fresh `vuu-portal` user token;
2. verifies the confidential requester appears in the subject token audience;
3. exchanges with `audience=self`;
4. verifies the exchanged audience;
5. verifies only `resource_access[self].roles` is present;
6. calls the remote `/api/authn`;
7. verifies the VUU token contains only expected target roles; and
8. verifies WebSocket login succeeds.

## Migration sequence

### Phase 1: additive Keycloak preparation

1. Create the portal login roles.
2. Add remote confidential clients that do not yet exist.
3. Enable standard token exchange.
4. Add confidential-client self-audience mappers.
5. Retain portal-to-server audiences.
6. Add group/user assignments for both login and resource roles.

Do not tighten existing role scopes in this phase.

### Phase 2: deploy application support

1. Add fixed authentication profiles and module-admin's logical connection.
2. Switch remote profiles to `always-exchange`.
3. Validate exchanged audience and identity.
4. Extract target-client roles only.
5. Change module registry permissions to portal login roles.
6. Add environment-based client secrets.

### Phase 3: tighten Keycloak scopes

1. Set confidential clients to `fullScopeAllowed=false`.
2. Reconcile each resource client to its own roles.
3. Remove stale managed cross-client role scope mappings.
4. Minimize claims in the public portal token while retaining exchange-eligibility
   audiences.

### Phase 4: activate and verify

1. Run `npm run keycloak:bootstrap`.
2. Restart all VUU servers.
3. Require a fresh browser login.
4. Verify portal registry filtering.
5. Verify each remote's `/api/authn` and WebSocket independently.
6. Invalidate or allow expiry of pre-migration in-memory VUU tokens.

### Phase 5: remove legacy configuration

Remove old audience mappers, role mappings, and retired clients only after all
servers run the new exchange path.

## Operational risks

- Removing portal-to-server audiences prevents confidential clients from
  exchanging the portal token.
- Enabling `always-exchange` before adding self-audience mappers causes
  `Requested audience not available` failures.
- Tightening role scopes before adding portal login roles can hide every remote.
- Additive bootstrap functions leave stale mappings and defeat isolation.
- Reusing the existing portal connection for module-admin bypasses on-demand
  module authorization.
- Client-secret drift is indistinguishable from some audience failures unless
  errors and health checks classify it explicitly.
- Existing VUU tokens retain old claims until expiry and are invalidated by
  server restart because `LoginTokenService` is in-memory.

## Acceptance criteria

- The portal token contains portal login roles but no remote permissions.
- Every visible remote corresponds to a portal login role.
- Opening a remote triggers exactly one server-side exchange per VUU session.
- The exchanged token is restricted to the target audience.
- The resulting VUU token contains only roles from the target resource client.
- Users cannot gain remote access from a portal login role alone.
- Users without a portal login role cannot discover the remote.
- Users with a portal login role but no remote permission receive a clear
  authorization failure.
- Module-admin uses a separate logical VUU connection or a standalone server.
- Bootstrap is idempotent and upgrades an existing realm safely.
