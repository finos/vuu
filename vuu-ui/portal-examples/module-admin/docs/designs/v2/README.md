# Module Admin – UI designs v2

A redesign of the module-admin screens. It addresses two problems with the
[v1 designs](../README.md):

1. **The page doesn't scroll.** When there are more modules than fit on the
   screen, some of them can't be reached.
2. **The page is too busy.** Summary metrics, filters, every module card with
   its full loading details, and a details side panel all share one screen.

The mockups are 3200×2000 (2× density) unless noted. They use the same tokens,
seed data and patterns as v1 and `user-admin`.

| # | Screen | Purpose |
| --- | --- | --- |
| 01 | `01-overview.png` | **Overview** (default page): summary cards with counts and a warning banner. There is no module list. |
| 02 | `02-overview-search.png` | Searching from the header shows the matching modules as a short table on the Overview page. Selecting a row opens that module. |
| 03 | `03-modules.png` | **Modules**: simplified cards (identity, status, description, menu location, access role, issues) with filters, sorting and grouping |
| 04 | `04-modules-scrolled.png` | Modules page with 18 modules grouped by menu section and scrolled. The page header and toolbar stay visible. |
| 05 | `05-module-detail.png` | **Module details**: a page for a single module, with nothing else on screen (3200×2284) |
| 06 | `06-module-detail-issues.png` | Module details with issues. Each issue has an action to fix it, and Enable is blocked until they are fixed. (3200×2584) |
| 07 | `07-module-edit.png` | Edit on the details page, scrolled. A sticky header shows the module and has jump links; a sticky save bar shows the unsaved changes. |
| 08 | `08-overview-dark.png` | Overview in dark mode |

The create form (v1 `03`), disable and delete dialogs (v1 `06`–`08`), menu
structure view (v1 `05`) and empty state (v1 `10`) are unchanged. They open from
the new pages.

## Structure

Module Admin follows the `user-admin` layout: an app header with a global
search, a left navigation, and one page at a time in the content area.

```
Overview        /overview          summary cards + search results
Modules         /modules           module cards (or table)
  └ Module      /modules/:name     details for a single module, view or edit
Menu structure  /menu              existing menu tree view
Needs attention                    shortcut to /modules?status=attention
```

- **Overview** shows only counts: registered, enabled, disabled, needs
  attention, menu sections and dedicated Vuu connections. Each summary card
  opens the Modules page with the matching filter. A warning banner appears
  only when something needs attention.
- **Search** lives in the app header, as it does in `user-admin`. It matches
  title, name, scope, route, menu and access role. Results replace the summary
  cards on the Overview page; press `Esc` or clear the search to go back.
- **Modules** cards show what you need to identify a module: icon, title,
  `name · version`, status, a two-line description, menu location, access role
  and a single issues line. Route, remote, host and Vuu connection appear only
  on the details page. The whole card is the target and opens the details
  page. Overflow menus and inline edit buttons are removed from cards.
- **Module details** is its own route, so it can be bookmarked and the browser
  Back button works. The selected module is the only content on the page:
  - A breadcrumb (`Modules › Basket trading`) and a `3 of 7` pager to step
    through the current filtered list without going back.
  - A header with identity, status, remote reachability, issue count, menu
    location and description. Primary actions are Edit and Disable/Enable;
    Duplicate, Check remote and Delete are in the overflow menu.
  - Issues, when there are any, appear above the configuration. Each has a
    direct fix action.
  - The main column holds configuration sections: portal navigation, module
    federation (with the remote check) and Vuu connection.
  - The side column holds access (role, users with access, User Admin link),
    related parent and child modules, and history.
- **Edit** happens in place on the details page instead of in a side panel.
  Fields keep the same sections. Changed fields are marked. A sticky
  compact header shows the module, the pending version and jump links. A
  sticky save bar shows the change count, Discard and Save. A Changes card
  lists each change and has Revert all. Leaving with unsaved changes asks
  for confirmation, as in `user-admin`.

## Scrolling

Each page scrolls inside the content area. The app header and left navigation
are fixed.

- The root must be height-constrained down to the scroll container:
  `height: 100%; min-height: 0` on every flex/grid ancestor, and
  `overflow: auto` on the content region only. Don't use `overflow: hidden`
  on the page.
- On Modules, the page header and toolbar are `position: sticky`. A divider and
  shadow appear once the page has scrolled.
- On the details page, the compact module header becomes sticky once the full
  header scrolls out of view. While editing, the save bar is also sticky.

## Open questions

- Should the summary cards on Overview also show a small breakdown per menu
  section, or is the count enough?
- Should the details pager follow the Modules filter and sort, or always use
  menu order?
- Should we keep the table view on Modules now that cards are smaller?
