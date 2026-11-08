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

## Examples and tests

- **Examples:** the showcase has examples under `Notifications/Toast` and `Notifications/NotificationOrigins`.
- **Component tests:** in `src/__tests__/__component__`, run with:

  ```sh
  npx playwright test --config=playwright.config.ts --project=components-chromium packages/vuu-notifications
  ```
