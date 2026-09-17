# `@vuu-ui/vuu-data-test`

## Local admin demo dependencies

The browser-only `USER_ADMIN` and `MODULE_DISCOVERY` test modules use the
unpublished `@heswell/user-admin` and `@heswell/module-admin` packages from a
local `vuu-websocket` checkout. Bootstrap the ignored bridge before installing
or building:

```sh
cd vuu-ui
npm run link:admin-packages -- /path/to/vuu-websocket
npm install
```

To link one package, run `npm run link:user-admin -- /path/to/vuu-websocket`
or `npm run link:module-admin -- /path/to/vuu-websocket`. Alternatively, set
`VUU_WEBSOCKET_ROOT` and run either command without a path. The script accepts
only these two package names, validates each upstream package root, refreshes
only symlinks, and refuses to replace a non-symlink path.

This is local-development-only: CI and published packages do not provide
`vuu-ui/.local-packages`. Browser code imports only browser-safe package
subpaths: `contracts` and `in-memory` for user-admin, and `contracts` for
module-admin.