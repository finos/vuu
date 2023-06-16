import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# RPC

<SvgDottySeparator style={{marginBottom: 32}}/>

## Menus

[Menu Items](Menu_items.md) act upon a `table`, `selection`, `row` or `cell` (these are called `scope`).

Once a `menu item` is registered by a server side [`provider`](../providers_tables_viewports/providers.md), it will be automatically displayed when user right-clicks on the corresponding Vuu Grid component.

Menu items may have filter expressions (applied for each individual row) that determine for which rows they are visible. If a menu item is visible, it can be invoked. On invocation, depending on the `scope` the RPC handler will receive context information about what are we acting upon.

## RPC Services

[RPC Services](service.md) allow us to expose server-side functionality to a Vuu client over a low-latency connection.

The Vuu client framework can discover and programmatically call these services over the WebSocket. While there is no generic UI for invoking/inspecting REST services, many components (such as the Autocomplete Search) use REST services as an implementation mechanism.

## REST Services

[REST Services](#) allow us to expose server-side functionality to a Vuu client. Each service is modeled in REST-ful resource fashion, and can define the following standard verbs: `get_all`, `get`, `post`, `put`, `delete`
