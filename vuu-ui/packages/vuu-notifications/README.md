# Notifications

`@vuu-ui/vuu-notifications` shows toast and workspace notifications.

Wrap the app in a `NotificationsProvider` and raise notifications with `useNotifications`:

```tsx
import {
  NotificationsProvider,
  useNotifications,
} from "@vuu-ui/vuu-notifications";

const SaveButton = () => {
  const { showNotification } = useNotifications();
  return (
    <button
      onClick={() =>
        showNotification({
          header: "Layout saved",
          status: "success",
          type: "toast",
        })
      }
    >
      Save
    </button>
  );
};

export const App = () => (
  <NotificationsProvider>
    <SaveButton />
  </NotificationsProvider>
);
```

`showNotification` returns an ID that can be passed to `hideNotification`. A toast is dismissed automatically after a delay unless `dismissal` is `"manual"`.

## What's new in this version

These changes let an app host other apps (for example, modules loaded with module federation in a portal) and still show every notification once, in one place, knowing where each came from.

### Notification origins

`NotificationOriginProvider` tags every notification raised beneath it with an `origin`:

```tsx
<NotificationOriginProvider connectionId="simul" moduleId="basket-trading">
  <BasketTrading />
</NotificationOriginProvider>
```

| Field            | Meaning                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `moduleId`       | The module that raised the notification.                                        |
| `connectionId`   | The Vuu server the module uses.                                                 |
| `parentModuleId` | For nested origins, the `moduleId` of the enclosing origin; set automatically. |

- **Explicit origins win:** a notification that already has an `origin` keeps it.
- **No provider, no origin:** outside any `NotificationOriginProvider`, notifications have no `origin`.
- **Reading it:** `useNotificationOrigin()` returns the current origin.

### Interceptor

`NotificationsProvider` takes an optional `interceptor`. It sees every notification raised beneath the provider before it is shown, and returns `"present"` to show it or `"suppress"` to drop it. A host can use it to keep a history of notifications, or to drop those from a module the user has muted.

```tsx
<NotificationsProvider
  interceptor={(notification) => {
    history.add(notification);
    return notification.origin?.moduleId === mutedModule
      ? "suppress"
      : "present";
  }}
>
```

Only the outermost provider's interceptor is used.

### One outermost provider

A `NotificationsProvider` inside another now renders only its children. Notifications raised anywhere beneath the outermost provider, including inside nested providers, are shown once, by that provider. A hosted app can therefore keep its own `NotificationsProvider`: it works standalone and defers to the host when embedded.

### Shared across copies of the package

The provider contexts are kept on the global object under `Symbol.for` keys, not in module scope. A module federation remote that loads its own copy of `@vuu-ui/vuu-notifications` still finds the host's provider.

### Other additions

- **`record`:** an optional flag on a notification, telling a host that keeps a notification history whether to record it. The host chooses the default.
- **New exports:**
  - the types `ToastNotificationDescriptor`, `WorkspaceNotificationDescriptor`, `NotificationOrigin`, `NotificationInterceptor` and `NotificationsProviderProps`
  - the type guards `isToastNotification` and `isWorkspaceNotification`
- **`children` is optional:** `NotificationsProvider` now accepts any `ReactNode`, not only elements.

## Compatibility

The changes are backward compatible: existing code needs no changes.

- **API:** every change is an addition or a widening.
  - Exports are only added.
  - The new notification fields (`origin`, `record`) are optional.
  - `NotificationsProvider`'s `children` accepts more than before.
- **Single provider:** an app with one `NotificationsProvider` behaves as before.
- **Callers outside a provider:** their notifications are still shown by the most recently mounted provider. vuu-shell's `WorkspaceProvider`, for example, sits above the shell's `NotificationsProvider`. If no provider is mounted anywhere, `showNotification` logs a warning and returns `undefined`, as before.
- **`useNotifications` identity:** without an origin, it returns the same stable functions as before.

Two cases now behave differently. Neither occurs in this repository outside showcase examples.

- **Nested providers:** before, all providers shared one notification centre and the last one to mount, usually the innermost, showed every notification. Now the outermost provider shows them.
- **Sibling providers:** two providers side by side now each show the notifications raised beneath them. Before, the last one to mount showed both sets.

## Vuu server support

The new attributes are filled in on the client, so they work with today's Vuu server. A portal gets more out of them if the server can also say who a notification concerns and how it should be treated. This section describes what the server sends today and what it would need to add.

### What the server sends today

The Vuu server notifies the client in two ways:

- **RPC responses:** a response can carry a `SHOW_NOTIFICATION_ACTION` with `notificationType` (`Error`, `Warning` or `Info`), `title` and `message`. The client shows it as a toast.
- **The `NOTIFICATIONS` module:** its `notifications` table has the columns `id`, `type`, `expiryTime`, `title`, `message`, `level` and `audience`, plus any columns the application adds. Rows are pushed to subscribers like any other table, so the server can notify users without a request.

### What each attribute is for, and what the server would need

| Attribute | What it's for in a portal | What the server would need |
| --- | --- | --- |
| `origin.moduleId` | Says which application a notification belongs to. The portal can then badge that application in its navigation, filter the notification history by application, and let the user mute an application. | **RPC responses:** nothing. The response returns to the application that made the request, and that application's `NotificationOriginProvider` sets the origin.<br>**`notifications` table:** a standard column naming the application, such as `module`, holding the application's client identifier. Without it, a notification can only be attributed to every application using that server. |
| `origin.connectionId` | Says which Vuu server a notification came from, when a portal uses several. | Nothing: the client knows which connection a message arrived on. |
| `origin.parentModuleId` | Attributes notifications from an application embedded in another to the outer application too. | Nothing: it comes from the nesting of origin providers on the client. |
| Topic, for routing | Lets applications declare the kinds of notification they care about (for example `orders`), so the server doesn't need to know application names. | A standard `topic` column on the `notifications` table. |
| `record` | Tells the portal whether to keep a notification in its history. A confirmation such as "Saved" needn't be kept; a rejected order should be. | An optional `record` field on `SHOW_NOTIFICATION_ACTION`. Rows in the `notifications` table are already a record, so they need nothing. |
| `status` (level) | Sets the toast's colour and icon. The worst unread level can also badge the portal's notification bell. | A `Success` value in `NotificationType`, which has only `Error`, `Warning` and `Info`. The `level` column should use the same four values. |
| `dismissal` | `"manual"` keeps a toast on screen until the user closes it. An error that needs acknowledging shouldn't disappear after a few seconds. | An optional `dismissal` field on `SHOW_NOTIFICATION_ACTION`, for example defaulting to manual for errors. |

The interceptor needs nothing from the server: it runs on the client and sees server and client notifications alike.

### Client changes to go with them

The context-menu RPC handler reads `notificationType` from the action: `Error`, `Warning` and `Info` are shown with those statuses, and an action without one as a success. Without a `title`, the header names the status. The mapping is `getServerNotificationStatus` in `@vuu-ui/vuu-utils`.

Two client changes remain:

- **Generic RPC responses:** the client returns only the `result` of an `RPC_RESPONSE` to the caller, so a `SHOW_NOTIFICATION_ACTION` on it, such as the server's "Failed to process … request" error, is not shown. Callers see the `ERROR_RESULT` and report it themselves.
- **New fields:** once the server sends `record` and `dismissal`, the handler should pass them to `showNotification` as well.

## Examples and tests

- **Examples:** the showcase has examples under `Notifications/Toast` and `Notifications/NotificationOrigins`.
- **Component tests:** in `src/__tests__/__component__`, run with:

  ```sh
  npx playwright test --config=playwright.config.ts --project=components-chromium packages/vuu-notifications
  ```
