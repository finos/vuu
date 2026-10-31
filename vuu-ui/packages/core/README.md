# @vuu-ui/core

Core VUU authentication and data-context APIs are exported from
`@vuu-ui/core` and can be registered as a shared Module Federation dependency.

Portal host and remote-module APIs are exported separately from
`@vuu-ui/core/portal` so portal dependencies are not included in the shared
module.

See [the portal design](./docs/portal-design.md) for details.

See [workspace components](./docs/workspace-components.md) for the
`portal-module` and `vuu-table` workspace item types, the workspace palette
and `usePortalDragSource`.
