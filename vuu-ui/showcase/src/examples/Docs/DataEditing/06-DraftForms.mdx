# Draft Forms

Some forms don't edit a table row: a user with a list of roles, a set of
preferences, or an entity the server builds from several tables. They are
saved with a single RPC, not through a session table. For these, keep the
values in React with `useEntityDraft`.

## useEntityDraft

```tsx
import { useEntityDraft } from "@vuu-ui/vuu-data-editing";

const draft = useEntityDraft<UserDetails>({
  initialValues: user,
  validate: ({ email, userName }) => ({
    ...(userName ? {} : { userName: "User name is required" }),
    ...(email.includes("@") ? {} : { email: "Enter a valid email address" }),
  }),
  onSubmit: async (values, changes) => {
    await rpc("updateUser", { ...changes, userName: values.userName });
  },
});
```

| Returned | Description |
| -------- | ----------- |
| `values`, `initialValues` | The current and starting values. |
| `setValue(name, value)`, `setValues(partial)` | Change values. |
| `changes` | Only the values that differ from `initialValues`. |
| `isDirty`, `isValid` | Whether anything changed, and whether `validate` passes. |
| `errors` | Errors for fields the user has touched, or all errors after a submit attempt. Use these for display. |
| `allErrors` | Every current error. |
| `touched`, `touch(name)` | Which fields the user has visited. Call `touch` on blur. |
| `submit()` | Validates and, if valid, calls `onSubmit(values, changes)`. |
| `submitting`, `submitted`, `submitError` | Submit progress. If `onSubmit` throws, the error is kept in `submitError`. |
| `reset(nextValues?)` | Go back to `initialValues`, or start again from `nextValues`. |

The draft resets whenever `initialValues` changes by reference, for example
when you store the saved values after a successful submit. Pass a stable value,
not an object literal. Pass `equals(a, b, field)` to compare values that
aren't primitives when working out `changes`.

## useAsyncValidation

Use `useAsyncValidation` for checks that need the server, such as "is this
user name free?". It debounces the check, cancels an outdated one when the
value changes, and caches results.

```tsx
const userNameCheck = useAsyncValidation<string>({
  validator: (userName, signal) => checkUserName(userName, signal),
  debounceMs: 300,
});

<Input
  onChange={(e) => {
    draft.setValue("userName", e.target.value);
    userNameCheck.validate(e.target.value);
  }}
/>;
{userNameCheck.status === "validating" ? "Checking…" : userNameCheck.error}
```

- `validator(value, signal)` resolves to an error message, or `undefined` if
  the value is valid. Pass `signal` to `fetch` (or listen for `abort`) so
  outdated checks stop.
- `validate(value)` returns a promise of the result, so `onSubmit` can await
  a final check.
- `status` is `idle`, `validating`, `valid` or `invalid`.
- `reset()` clears the result; `clearCache()` forgets cached results.

The showcase example **Data Editing / Edit Forms / Entity Draft Form** shows
both hooks together.
