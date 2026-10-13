# @vuu-ui/vuu-playwright-helpers

Playwright helpers for Vuu components.

All helpers extend `PlaywrightPageObject` and are instantiated from the Playwright `page`.
`PwTable` locates its target element using a default CSS selector, which can be
overridden at runtime. `PwTableHeaderCell` requires an explicit CSS selector.

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
