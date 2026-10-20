# @vuu-ui/vuu-playwright-helpers

Playwright helpers for Vuu components.

All helpers extend `PlaywrightPageObject` and are instantiated from the Playwright `page`.
Component helpers extend `PwComponent`, which locates the component root element using
a default CSS selector. This can be overridden at runtime by passing a CSS selector or a
`Locator`. `PwComponent` provides common helpers:

- `locator` - the component root `Locator`, for web-first assertions not covered by a helper
- `isReady()` - waits until the component is visible, resolves with the component
- `isVisible()` - is the component currently visible (no waiting)
- `assertVisible()`, `assertNotAttached()`

## PwTable

```ts
// uses the default selector (.vuuTable)
const table = new PwTable(page);
// override the default selector
const table1 = new PwTable(page, '[data-testid="table-1"]');

const cell = await table.cell("currency", 2);
const header = table.headerCell("currency");
const isSelected = await header.isSelected;
await header.assertSelected();
await table.editCell("currency", 2, "USD"); // commits by default
await table.editCell("currency", 2, "EUR", "cancel");
```

Prefer `cell(colName, ariaRowIndex)` for new usage. `ariaRowIndex` is the 1-based
ARIA row index, including header rows (with one header, the first data row is 2).
The existing `locateCell` overloads remain available for gradual migration.

## PwContextMenu, PwMenuItem

`PwTable.showContextMenu(colName, ariaRowIndex)` right clicks a cell and resolves with a
`PwContextMenu` once the menu is visible.

```ts
const menu = await table.showContextMenu("ric", 2);

expect(await menu.hasMenuItems()).toBe(true);
expect(await menu.hasMenuItems(["Copy text", "Filter"])).toBe(true); // exact, in order
expect(await menu.menuItemLabels()).toEqual(["Copy text", "Filter"]);

const copy = menu.menuItem("Copy text"); // or by 0 based index, menu.menuItem(0)
expect(await copy.hasIcon("edit")).toBe(true);
expect(await copy.isEnabled()).toBe(true);
expect(await menu.menuItem("Filter").hasChildren()).toBe(true);

// sub menus, opened with mouse (default) or keyboard
const filterMenu = await menu.menuItem("Filter").openSubMenu();
await filterMenu.menuItem("Include value").click();
await menu.assertNotAttached();

// keyboard
await menu.press("ArrowDown");
await menu.assertFocusedMenuItem("Copy text");
await menu.press("Enter");
await menu.close(); // Escape
```

When a key press depends on the focus change made by the previous key, call
`assertFocusedMenuItem` in between. Keys pressed before the menu has processed a
focus change may be delivered to the previously focused item.
