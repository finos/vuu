# Saved state: getting started for remote authors

A portal saves each application's runtime state for the user and restores it
the next time the application opens: filters, sort order, column layouts,
panel sizes and similar. This is **saved state**. It's automatic, so users
don't choose to save it. They can clear it from the portal's **Saved state**
dialog.

Saved state isn't Settings. A future, explicit Settings dialog will manage
choices such as theme and number formatting. Use the term "saved state" for
this feature in code, identifiers and copy.

Follow the four steps below to add saved state to a remote module. The later
sections cover direct store access, release migrations, and standalone use.
The design and implementation notes are in
[portal-persistence-design.md](./portal-persistence-design.md).

Everything here is exported from `@vuu-ui/core/portal`.

## Getting started

### 1. Configure the module descriptor

Saved state is scoped to the signed-in user, an application key, and a
version. `version` and `clientIdentifier` come from `VuuModuleDescriptor`;
`persistenceKey` is an optional `RemoteModuleDescriptor` override. Apply these
fields to the descriptor you register:

```ts
import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";

const savedStateFields = {
  clientIdentifier: "orders-v2",
  persistenceKey: "orders", // Keeps the same saved state after an ID change.
  version: 1,
} satisfies Pick<
  RemoteModuleDescriptor,
  "clientIdentifier" | "persistenceKey" | "version"
>;
```

Keep `clientIdentifier` stable, or set a stable `persistenceKey` if the
identifier may change when the module is re-registered. Keep `version` as an
integer and bump it when a release changes the shape or meaning of saved
values; see [Release migrations](#release-migrations). Without a usable key
and integer version, the remote gets no persistent store and the hook behaves
like `useState`.

### 2. Read and write JSON state

For a value that belongs to a component, `usePersistentState` works like
React's `useState` and restores the saved value on the component's first
render:

```tsx
import { usePersistentState } from "@vuu-ui/core/portal";

type OrdersView = {
  filter: string;
  sort: "symbol" | "quantity";
};

export const Orders = () => {
  const [view, setView] = usePersistentState<OrdersView>(
    "orders/view",
    { filter: "", sort: "symbol" },
    { label: "Orders view", group: "Orders" },
  );
  return (
    <OrdersTable
      filter={view.filter}
      sort={view.sort}
      onFilterChange={(filter) => setView((previous) => ({ ...previous, filter }))}
      onSortChange={(sort) => setView((previous) => ({ ...previous, sort }))}
    />
  );
};
```

- When no value has been saved, the hook returns `defaultValue`.
- Setters update the value immediately; writes are saved after a short delay.
- As with `useState`, a literal default is widened: `usePersistentState("n", 0)`
  gives a `number`.
- Values must be JSON: `null`, booleans, numbers, strings, arrays and plain
  objects. `Date`s, functions, `undefined`, non-finite numbers, class
  instances and cycles are rejected. In development they throw; in production
  they're logged and ignored. Sparse arrays and symbol, accessor,
  non-enumerable, or extra array properties are also rejected rather than
  silently omitted during serialization.
- Setting a value that's deep-equal to the saved one does nothing.
- A value can be up to 256 KB when serialised, and an application's saved
  state up to 1 MB.

For values shared across components or not naturally owned by one component,
use the store from [`useApplicationState`](#using-the-store-directly). Use
`useOptionalApplicationState` instead if the same code must also run outside a
portal.

### 3. Choose stable keys and useful labels

Each saved value needs a stable, non-empty key of up to 256 characters. The
key identifies that value across renders and releases, so keep it stable or
write a [migration](#release-migrations) when it must change. Keys are scoped
to the application's store; you don't need to prefix them with the
application name. Use `/` to group related keys, such as `filters/active` and
`table/sort` (it's a naming convention, not special service behavior).

The Saved state dialog lets users find and clear individual values. Give each
value a human-readable `label`; optionally use `group` to collect related
values. Without metadata, the dialog falls back to showing the key. The
application title comes from the module descriptor's `title`.

Write labels as the user would describe the value: "Column layout", "Saved
filters", "Split position". Use sentence case and no trailing punctuation.
Keys beginning with `vuu.` are reserved for the portal and shared VUU
components.

### 4. Return to defaults when users clear state

Users can clear selected values, an application's saved state, or all saved
state from the portal's Saved state dialog. When a value used by
`usePersistentState` is cleared, the hook returns its `defaultValue` and the
component re-renders without requiring a reload. Clearing the application's
state therefore returns the module to its default view.

If you read values directly from the store, subscribe and respond to cleared
keys; otherwise the dialog's success message offers a **Reload** action when
an open application needs one. See [Reacting to Clear](#reacting-to-clear) for
the store event details.

## Advanced topics

### Using the store directly

For more than one value, or when a value isn't tied to a single component,
use the store:

```ts
import { useApplicationState } from "@vuu-ui/core/portal";

const store = useApplicationState();

const layout = store.get<ColumnLayout>("table/columns");
store.set("table/columns", nextLayout, { label: "Column layout", group: "Table" });
store.remove("table/columns");

useEffect(
  () =>
    store.subscribe(({ keys, reason }) => {
      // reason is "set", "remove", "clear" or "external" (another tab, or
      // the Saved state dialog). An empty `keys` means everything changed.
    }),
  [store],
);
```

| Member | Use |
| ------ | --- |
| `get(key)` / `getAll()` / `has(key)` / `keys()` | Read values. They're copies, so changing them doesn't change saved state. |
| `set(key, value, { label?, group?, formatVersion? })` | Update the value in memory now; it's saved after a short delay. |
| `describe(key, { label, group })` | Record metadata without setting a value. |
| `remove(key)` / `clear()` | Remove one value, or all of them for this version. |
| `flush()` | Save pending changes now. The portal already does this when the page is hidden and on logout. |
| `subscribe(listener)` | Hear about changes, including those made elsewhere. |
| `status` / `error` | `"ready"`, or `"error"` when saved state couldn't be loaded or saved. |
| `previousVersions()` / `importFrom(version, …)` | Rarely needed; see [Release migrations](#release-migrations). |

- `useApplicationState()` throws when the component isn't hosted by a portal.
- `useOptionalApplicationState()` returns `undefined` instead. Use it in code
  that can also run standalone, and in shared components.

### When the store can't load

If saved state can't be loaded, for example because storage is unavailable,
the application still renders, using its defaults. `store.status` is
`"error"`, and changes are kept in memory for the session but not saved. The
Saved state dialog tells the user. Don't block the application on saved
state.

### Reacting to Clear

When the user clears saved state from the dialog, open applications are told
straight away:

- `usePersistentState` values go back to their defaults, so the application
  returns to its default view without a reload.
- If you read the store directly, subscribe to it and reset when your keys
  are cleared.
- If an open application doesn't subscribe, the dialog's success toast offers
  **Reload**.

### Opening the Saved state dialog

An application can offer its own way in, such as a "Reset view" button.
`useSavedStateDialog` opens the dialog, scoped to the current application:

```tsx
import {
  useOptionalApplicationState,
  useSavedStateDialog,
} from "@vuu-ui/core/portal";

const store = useOptionalApplicationState();
const savedState = useSavedStateDialog();

return savedState.available ? (
  <Button onClick={() => savedState.open(store?.applicationKey)}>
    Saved state…
  </Button>
) : null;
```

Outside a portal shell, `available` is `false` and `open` does nothing. Call
`open()` with no key to show all applications.

### Application key

The portal, not the remote, decides which document an application uses. The
key comes from the module descriptor:

```text
applicationKey = descriptor.persistenceKey ?? descriptor.clientIdentifier
```

- `clientIdentifier` is the default. Keep it unique and stable.
- Set `persistenceKey` to keep users' saved state when a module is
  re-registered under a new `clientIdentifier`. It must be unique across the
  registry.
- A descriptor with neither, or without an integer `version`, gets no store.
  `usePersistentState` then behaves like `useState`.
- The same remote registered twice, for example with different
  `ComponentProps`, gets two independent documents.

```ts
{
  clientIdentifier: "vuu-orders-v2",
  persistenceKey: "vuu-orders",
  version: 3,
  // …
}
```

## Versions

Saved state is kept separately for each descriptor `version`. When a new
version opens for the first time, the portal copies the latest earlier
version's saved state and runs the release migrations, before the
application renders. The earlier version's saved state isn't changed, so
rolling back restores exactly what the user had.

- A version bump with no migrations keeps everything as it was.
- If only later versions have saved state (the application was rolled back),
  the version starts empty.
- Users see previous versions in the Saved state dialog, under
  **Previous versions**, and can clear them.

## Release migrations

A release that renames or removes columns, keys or features, or changes the
meaning of a saved value, ships a migration for it. Export `stateMigrations`
from the module that the descriptor's `mfComponent` exposes, next to the
component:

```tsx
// Orders.tsx (exposed as "./Orders")
import type { StateMigration } from "@vuu-ui/core/portal";

export const stateMigrations: StateMigration[] = [
  {
    version: 2,
    description: "ccy renamed to currency; lotSize removed",
    migrate(state) {
      state.update<ColumnLayout>("table/columns", (columns) =>
        columns
          .filter((column) => column.name !== "lotSize")
          .map((column) =>
            column.name === "ccy" ? { ...column, name: "currency" } : column,
          ),
      );
      state.update<string>("filters/active", (filter, entry) =>
        filter.includes("lotSize")
          ? entry.reject("It uses the Lot size column, which has been removed")
          : filter.replaceAll("ccy", "currency"),
      );
    },
  },
  {
    version: 3,
    migrate(state) {
      state.rename("table-layout", "table/columns");
      state.remove("legacy/view");
    },
  },
];

export default Orders;
```

`RemoteModule` loads the saved state and the remote code in parallel, and
runs the migrations before the component renders.

### The migration API

`migrate(state)` receives a `MigratableState`, a copy of the previous
version's saved state:

| Member | Use |
| ------ | --- |
| `fromVersion` / `toVersion` | The versions being migrated between. |
| `get` / `has` / `keys` | Read the copy. |
| `update(key, (value, entry) => next)` | Transform one value. A missing key is skipped. |
| `entry.reject(reason)` | Return this from `update` to drop the value and record why. |
| `entry.notify(message)` | Keep the value, and tell the user something changed. |
| `set(key, value, metadata?)` | Add a value. |
| `rename(from, to)` / `remove(key)` | Move or drop a value. |

Rules:

- **Migrations run in order, once.** A user going from version 1 to 3 runs the
  migrations for 2, then 3. Each `version` must be a unique integer no higher
  than the current version; otherwise the migrations are rejected and the
  version starts empty.
- **Errors are contained.** An error thrown inside an `update` callback
  rejects only that value. An error anywhere else aborts the migration: the
  new version starts empty, the user is told, and the previous version's
  saved state is kept.
- **Work on JSON only.** Migrations can't reach the server or the running
  application. `migrate` may return a promise, for example to `import()`
  helpers, but shouldn't wait on anything else.
- **Never change meaning.** If any part of a filter refers to a removed
  column, reject the whole filter. Dropping one clause would show the user
  rows they think are filtered out. For a list of named filters, remove each
  affected filter whole, `notify`, and keep the rest.
- **Write reasons for users.** `reject` reasons and `notify` messages appear
  in the portal, so use plain language: "It uses the Lot size column, which
  has been removed."

| Value | Change in the release | Migration |
| ----- | --------------------- | --------- |
| Column layout | Column renamed or removed | Rename or drop the column. Silent. |
| Sort | Sort column renamed or removed | Rename, or drop that sort column. Silent. |
| Group by | Group column removed | Drop it, and `notify`. |
| Active filter | Column renamed | Rewrite the filter. Silent. |
| Active filter | Any clause refers to a removed column | `reject` it. |
| Named filters | Some refer to removed columns | Remove each affected filter whole and `notify`; keep the rest. |
| Any | Feature removed | `remove` the key. Silent. |

### What users see

- Rejected values appear under the application in the Saved state dialog, in
  a **Not carried forward** group, with the reason in a tooltip. The
  originals stay with the previous version.
- When the application first opens after the update, a toast says **Some
  saved state wasn't carried forward**, with a **Review** action that opens
  the dialog for that application. `notify` messages alone produce an
  information toast, **Saved state carried forward**.

### Testing migrations

Test each path to the current version against saved state captured from each
released version, with `runStateMigrations`:

```ts
import { runStateMigrations } from "@vuu-ui/core/portal";
import { stateMigrations } from "../src/Orders";
import version1 from "./fixtures/orders-state-v1.json";

it("carries version 1 forward to version 3", async () => {
  const { document, notifications } = await runStateMigrations(
    version1,
    stateMigrations,
    3,
  );
  expect(document.entries["table/columns"].value).toEqual([
    { name: "currency", width: 120 },
  ]);
  expect(document.notCarriedForward).toEqual([
    expect.objectContaining({ key: "filters/active" }),
  ]);
  expect(notifications).toEqual([]);
});
```

To capture a fixture, copy the value of the application's
`vuu-portal:{portalId}:state:{user}:{applicationKey}:v{version}` key from the
browser's localStorage.

### Component formats

A shared component that changes the shape of its own value (for example, a
new table layout format) doesn't need every application to migrate it.
Instead it writes `formatVersion` with its values
(`store.set(key, value, { formatVersion: 2 })`), reads its own older formats,
and writes the current format next time it saves.

## Shared components

A component used by many applications mustn't assume a fixed key:

- take a key, or key prefix, from the owning application as a prop;
- read and write through `useOptionalApplicationState()`, so it works with or
  without a portal;
- supply `label` and `group` metadata; and
- publish helpers for its value formats, so applications' migrations stay
  short.

## Running outside a portal and in tests

- Standalone, and in tests without a portal, `usePersistentState` is ordinary
  component state and `useOptionalApplicationState()` returns `undefined`.
- To test with saved state, provide a store from an in-memory service:

```tsx
import {
  ApplicationStateProvider,
  InMemoryPersistenceBackend,
  createPortalPersistenceService,
} from "@vuu-ui/core/portal";

const service = createPortalPersistenceService({
  backend: new InMemoryPersistenceBackend(),
  user: "test-user",
  debounceMs: 0,
});
const store = service.getStore("orders", 1);
await store.ready;

render(
  <ApplicationStateProvider store={store}>
    <Orders />
  </ApplicationStateProvider>,
);
```

## For portal hosts

`PortalShell` creates the persistence service for the signed-in user and saves
to localStorage by default. `WindowHost` and `WindowShell` take the same
props, so a module opened in its own window uses the same saved state.

```tsx
<PortalShell
  id="portal-demo"
  // Stored under vuu-portal:{portalId}:state:…; defaults to `id`.
  portalId="portal-demo"
  // A PersistenceBackend, or false for in-memory only. Pass a stable instance.
  persistence={backend}
  remoteModules={modules}
>
  …
</PortalShell>
```

- The portal saves its own state (such as which navigation groups are
  expanded) under the reserved application key `vuu.portal`.
- `PortalHeader` shows the user menu with **Saved state…** and **Log out**.
  Log out saves pending changes before signing the user out. Extra menu items
  go in its `userMenuItems` prop.
- `portal-examples/portal-host` registers a **Saved state demo** module
  (`feature-simple-div`) that uses `usePersistentState` and exports
  `stateMigrations`.
