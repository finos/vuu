# Remote Modules & Multi-Connection Requirements

## 1. Purpose

Define implementation requirements for evolving `app-vuu-example` from a single VUU websocket connection model to a module-federation model where the host (portal) and each remote module can use independent VUU server connections.

This document is intended to be implementable without additional clarification.

---

## 2. Scope

### In scope

- `vuu-ui` only.
- `sample-apps/app-vuu-example` acts as host/consumer runtime container.
- `sample-apps/feature-*` are remote module examples.
- Runtime connection architecture in `packages/vuu-data-remote`, including worker-based websocket handling.
- Host/remote discovery and runtime loading via config + module registry.
- Authentication/token flow integration for portal + remote VUU servers.

### Out of scope (this phase)

- Scala server implementation changes.
- Replacing static `module-registry.json` with a dynamic registry service.
- Multi-server routing *within* a single remote module (assume one module -> one VUU server).

---

## 3. Current-State Constraints

1. The UI currently assumes one server websocket endpoint.
2. Communication is managed by a singleton `ConnectionManager`.
3. Websocket protocol handling is in a web worker (`worker.ts` + `DedicatedWorker`).
4. Host config (`config.json`) currently includes:
   - `ssl`
   - `authUrl`
   - `moduleRegistryUrl`
   - `restUrl`
   - `websocketUrl`

---

## 4. Target-State Requirements

## 4.1 Runtime topology

1. There is always a **portal VUU server**.
2. Portal is the minimum auth integration point.
3. Remote modules may connect to other VUU server deployments.
4. Initial assumption: **each remote module connects to exactly one VUU server**.

## 4.2 Connection model

1. Replace single-connection internals with a **connection registry** keyed by `connectionId`.
2. Each connection instance MUST own:
   - its own websocket worker instance
   - its own server proxy/session lifecycle
   - independent connection status events
3. Backward compatibility:
   - Existing APIs that use singleton `ConnectionManager` MUST continue to work by defaulting to connectionId `portal`.

## 4.3 React composition model

1. Keep existing host `Shell` role.
2. Introduce a `RemoteModule` React boundary component that:
   - represents one remote module runtime instance
   - binds data access to one `connectionId`
   - lazy-loads/render remote entry component
3. `RemoteModule` MUST isolate connection context so data sources inside the remote resolve against that module’s server, not implicitly against portal.
4. The existing layout workflow for feature instantiation MUST be preserved:
   - available features are listed in shell navigation/palette from registry descriptors
   - user drags a feature from the list onto the workspace to create an instance
   - this interaction remains implemented through `Feature.tsx` integration with palette/layout plumbing.

## 4.4 Discovery model

1. Host MUST discover remotes from `moduleRegistryUrl` (currently static JSON).
2. The registry remains file-based in this phase.
3. Registry entries MUST include enough data to:
   - locate and load the remote module bundle
   - identify target VUU connection/server details for that module

---

## 5. Authentication & Token Requirements

## 5.1 Target auth flow (Keycloak-ready)

1. User accesses host while unauthenticated.
2. User is redirected to `authUrl` (Keycloak in target; simple-login-app in dev).
3. A bearer token is acquired from identity provider.
4. Host uses `restUrl` to call VUU portal token endpoint and exchanges bearer token for a **VUU access token**.
   - Dev simple-login-app path may still post username/password to obtain equivalent token material.
5. Websocket `LOGIN` for portal includes VUU access token.
6. Portal validates bearer/token chain (target validation against Keycloak).
7. The VUU access token is then used for remote-module websocket `LOGIN` to other VUU servers.

## 5.2 Token ownership and reuse

1. Host owns token acquisition and refresh lifecycle.
2. Remotes MUST NOT implement their own identity-provider login flow.
3. Remotes receive VUU access token from host-provided abstraction.
4. Introduce a token provider contract in host runtime:
   - `getBearerToken(): Promise<string>`
   - `getVuuAccessToken(): Promise<string>`
   - extension point for refresh/retry.

---

## 6. Configuration Requirements

## 6.1 Host config (`config.json`)

Host config MUST continue to support:

```json
{
  "ssl": true,
  "authUrl": "http://localhost:5001",
  "moduleRegistryUrl": "/module-registry.json",
  "restUrl": "https://localhost:8443",
  "websocketUrl": "wss://localhost:8090/websocket"
}
```

Semantics:

- `authUrl`: IdP entry point (Keycloak target, simple-login-app dev).
- `restUrl`: Portal REST base used for token exchange.
- `websocketUrl`: Default portal websocket endpoint.
- `moduleRegistryUrl`: location of remote module descriptor list.

## 6.2 Module registry schema (phase 1 file-based)

Each remote descriptor MUST provide:

1. Remote loading metadata.
2. VUU connection metadata.

Minimum required shape:

```json
{
  "name": "feature-basket-trading",
  "title": "Basket Trading",
  "remoteEntry": "/feature-basket-trading/remoteEntry.js",
  "exposedModule": "./Feature",
  "vuu": {
    "connectionId": "basket",
    "websocketUrl": "wss://localhost:8091/websocket"
  }
}
```

Notes:

- `connectionId` MUST be unique per module instance in host runtime.
- If `vuu.websocketUrl` is omitted, host MAY fallback to portal `websocketUrl` (for compatibility).

---

## 7. Implementation Requirements (Engineering)

## 7.1 Connection registry and worker

1. Refactor `ConnectionManager` internals to manage multiple connections.
2. Do not share websocket/worker state across `connectionId`s.
3. Support at least:
   - `connect(connectionId, options)`
   - `disconnect(connectionId)`
   - `serverAPI(connectionId)`
   - `connectionStatus(connectionId)`
4. Keep legacy no-arg access path bound to `portal`.

## 7.2 Data source integration

1. Data source creation path MUST be able to request server API by `connectionId`.
2. Existing feature code without explicit `connectionId` must continue using `portal`.
3. Remote module root MUST provide connection scope to nested data consumers.

## 7.3 Host + remote composition

1. Host loads module descriptors from `moduleRegistryUrl`.
2. Host registers available remotes and presents them in navigation similarly to current feature model.
3. On remote activation/load:
   - resolve module descriptor
   - ensure connection exists for descriptor `connectionId`
   - render `RemoteModule` with connection scope + lazy-loaded module component.
4. Drag-and-drop instantiation from the feature list MUST continue unchanged for users:
   - no alternative mandatory flow (e.g. click-only launch) may replace current DnD behavior
   - `Feature.tsx` remains the component boundary used by layout `PaletteItem` creation.

## 7.4 Error handling and UX

1. Connection/auth failures for one remote MUST NOT crash the entire shell.
2. Remote-level failure state must be visible in the feature container.
3. Portal connection failure remains application-critical and should block normal runtime.

---

## 8. Non-Functional Requirements

1. Preserve existing single-server behavior when module federation is not configured.
2. Avoid global mutable auth state inside remotes.
3. Ensure per-connection cleanup on remote unload/disconnect (worker termination where applicable).
4. Logging/telemetry should identify `connectionId` for diagnostics.

---

## 9. Acceptance Criteria

1. Host can authenticate via `authUrl` + `restUrl` and obtain VUU access token.
2. Portal websocket connects and logs in using VUU access token.
3. At least two remote modules can be loaded where each uses a distinct websocket endpoint.
4. A connection failure in one remote does not terminate other active module connections.
5. Existing feature flows still work in legacy single-endpoint config with no remote VUU override.
6. Module discovery is driven by `moduleRegistryUrl` JSON (no hard-coded module list in app code).
7. Users can still drag a listed feature onto the workspace and instantiate a remote feature UI through the existing `Feature.tsx`-based layout flow.

---

## 10. Delivery Phasing

## Phase 1 (this initiative)

- Multi-connection registry + compatibility facade.
- `RemoteModule` boundary and connection scoping.
- Static file-based module registry ingestion.
- Token exchange + reuse model wired in host runtime.

## Phase 2 (later session)

- Replace static `module-registry.json` with dynamic registry service.
- Extend token refresh/re-auth and remote authorization policies as needed.