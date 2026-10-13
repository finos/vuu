# @vuu-ui/vuu-playwright-helpers

Playwright helpers for Vuu components.

All helpers extend `PlaywrightPageObject` and are instantiated from the Playwright `page`.
Each helper locates its target element using a default CSS selector, which can be
overridden at runtime.

```ts
// uses the default selector (.vuuTable)
const table = new PwTable(page);
// override the default selector
const table1 = new PwTable(page, '[data-testid="table-1"]');

const cell = await table.locateCell(2, "currency");
```
