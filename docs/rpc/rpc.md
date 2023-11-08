import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# RPC

<SvgDottySeparator style={{marginBottom: 32}}/>

## Overview of RPC

There are two scopes where rpc services can be defined:

- Global Scope - these are services that can be called without a viewport being created.
- Viewport Scope - these are services that are created when a user creates a viewport

## Global Scope - RPC Services

[RPC Services](service.md) allow us to expose server-side functionality to a Vuu client over a low-latency web-socket connection.

The Vuu client framework can discover and programmatically call these services over the WebSocket. While there is no generic UI for invoking/inspecting REST services, many components (such as the Autocomplete Search) use services as an implementation mechanism.

## Global Scope - REST Services

REST Services allow us to expose server-side functionality to a Vuu client. Each service is modeled in REST-ful resource fashion, and can define the following standard verbs: `get_all`, `get`, `post`, `put`, `delete`

## Viewport Scope - Menu Items

[Menu Items](Menu_items.md) act upon a `table`, `selection`, `row` or `cell` (these are called `scope`).

Once a `menu item` is registered by a server side [`provider`](../providers_tables_viewports/providers.md), it will be automatically displayed when user right-clicks on the corresponding Vuu Grid component.

Menu items may have filter expressions (applied for each individual row) that determine for which rows they are visible. If a menu item is visible, it can be invoked. On invocation, depending on the `scope` the RPC handler will receive context information about what are we acting upon.

## Viewport Scope - RPC Calls

[Viewport RPC](Viewport_rpc.md) calls are specific service methods that we want to call on a viewport we've created. They are specific i.e. the UI component needs
to understand the type of call that is being called. In that way they should be used in functionally specific UI components.

They implicitly have access to the viewport and its associated tables that they are being called on.
