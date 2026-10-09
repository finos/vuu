# Vuu Showcase

Run `npm run showcase` from `vuu-ui` for development, or
`npm run showcase:prod` for a production build served at
`http://localhost:4173`.

The shell is an Rsbuild host. Examples are exposed by the
`showcase_examples` Module Federation remote at `/showcase-examples/`; the
shell keeps each selected example isolated in its existing iframe. Adding an
`.examples.tsx` or `.mdx` file below `src/examples` automatically adds a stable
remote expose and navigation descriptor.

Development uses one server at `http://localhost:4173`. The examples remote is
watched and rebuilt into the host's development output, then served by the host
at `/showcase-examples/`.

## Example annotations

A doc comment made up only of `key=value` pairs, directly before an exported
example, annotates that example:

```tsx
/** tags=data-consumer,remote-module contextPanelPlacement=module */
export const OrdersBlotter = () => <Orders />;
```

`tags` is a comma separated list; any other key is kept as an attribute of the
example. Ordinary doc comments are ignored.

| Tag             | Meaning                                                             |
| --------------- | ------------------------------------------------------------------- |
| `data-consumer` | The example uses data; the toolbar offers local or remote data      |
| `remote-module` | The example is hosted in a portal by default (see below)            |

## Portal hosting

The toolbar's **Component / Portal** toggle chooses how the selected example
is hosted. **Portal** renders a `PortalShell` that loads the example with
`RemoteModule` from the `showcase_examples` remote, just as a portal loads an
application. The example therefore gets the portal's services, such as the
context panel, modals, notifications and saved state, and goes through the
same loading path, including the remote's `config.json`.

Examples tagged `remote-module` open in **Portal** mode; the rest open in
**Component** mode. In a standalone window the mode is the `host` hash
parameter, `host=portal` or `host=component`.

These attributes configure the module when portal hosted:

| Attribute               | Meaning                                                 |
| ----------------------- | ------------------------------------------------------- |
| `contextPanelPlacement` | `shell` (default) or `module`, see `RemoteModule`       |
| `title`                 | The module title; defaults to the example's name        |

Saved state is kept in memory, so each load starts afresh.

The showcase shares every package as a Module Federation singleton,
including `@vuu-ui/vuu-ui-controls`, which a real portal doesn't share.
Code that works here through a `vuu-ui-controls` provider may not reach the
portal from a real remote; use the `@vuu-ui/core` APIs, such as
`useContextPanel`, in remote modules.
