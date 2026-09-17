# `@vuu-ui/vuu-data-test`

## Local UserAdmin demo dependency

The browser-only `USER_ADMIN` test module uses the unpublished
`@heswell/user-admin` package from a local `vuu-websocket` checkout. Bootstrap
the ignored bridge before installing or building:

```sh
cd vuu-ui
npm run link:user-admin -- /path/to/vuu-websocket
npm install
```

Alternatively, set `VUU_WEBSOCKET_ROOT` and run `npm run link:user-admin`.
This is local-development-only: CI and published packages do not provide
`vuu-ui/.local-packages/user-admin`. Browser code must continue to import only
the `contracts` and `in-memory` subpaths.