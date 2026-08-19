# VUU data editing design

## Purpose

`@vuu-ui/vuu-data-editing` is the home for VUU's reusable data editing
features. It coordinates edit-session state with editable data sources and
provides React integrations for edit-mode controls.

The initial implementation is copied from `@vuu-ui/vuu-utils`. The originals
remain in place so existing consumers continue to work while applications
migrate to this package.

## Architecture

`useEditableTable` creates or accepts a source data source and owns an
`EditSession`. The session calls `createSessionDataSource` with a `CopyOption`
and tracks cell edits and row changes against the returned data source.

The hook exposes `dataSource` as the lifecycle-selected active data source for
direct use by `Table`, plus `sourceDataSource` for source-only statistics,
filters, menus, and external workflows. During inline editing, React passes the
session data source to `Table`; after save or cancel succeeds it passes the
source data source back. `useDataSource` owns subscription suspend/resume and
ignores callbacks from obsolete data-source bindings.

`DataEditingProvider` makes the session available to nested controls, while
`EditButtons` reflects session state in the available editing actions.

## Files

| File                          | Responsibility                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/EditSession.tsx`         | Implements the edit-session lifecycle, change tracking, row operations, validation state, save, cancel, and stale-update handling. |
| `src/useEditableTable.ts`     | Connects an `EditSession` to React and a VUU data source, exposing handlers and state for editable tables.                         |
| `src/DataEditingProvider.tsx` | Provides the active `EditSession` through React context.                                                                           |
| `src/EditModeProvider.tsx`    | Provides shared view/edit mode state for editing controls.                                                                         |
| `src/EditButtons.tsx`         | Renders save, cancel, delete, and add-row controls based on edit-session state.                                                    |
| `src/edit-utils.tsx`          | Supplies user-facing stale-update messages.                                                                                        |
| `src/index.ts`                | Defines the package's public API.                                                                                                  |

## Dependencies

Data-source and protocol contracts come from the VUU type packages. Shared
formatting, event, RPC, and React utilities remain in `@vuu-ui/vuu-utils`;
this package depends on them rather than duplicating unrelated utilities.
