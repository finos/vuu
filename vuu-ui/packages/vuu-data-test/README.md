# `@vuu-ui/vuu-data-test`

## Local basket trading

Constituent reference data is generated from the server's four CSV files in
`example/main/src/main/resources/static/`. From `vuu-ui`, run
`npm run generate:basket-data` after editing those files and commit the resulting
`src/basket/reference-data/constituent-data.json`. Use
`npm run generate:basket-data -- --check` to verify it is up to date.
The converter preserves source weights (without normalizing their units),
maps the differing price/change column names, and rejects invalid CSV records.
The browser loads only the generated JSON, not the CSV parser.
The JSON and its `constituents.ts` adapter use different basenames so their
JavaScript build outputs cannot collide.

The `BASKET` module provides its own simulated constituent prices, including
updates for all basket instruments. Its constituent join retains
`instanceIdRic` as the row key, so multiple trading baskets can contain the
same instrument. Direct edits through the join update the underlying
constituent table; subsequent price ticks preserve those edits.
Changing the basket side flips each constituent's current side, preserving
mixed BUY/SELL positions, as on the Scala server. Unchanged side edits do
nothing, and other basket instances are unaffected.
Editing basket units recalculates its constituent quantities as
`weighting * units`, truncated to whole units, matching the Scala service.

New baskets retain the `basketTradeName` supplied by the creation dialog.
Constituents default to the Limit price strategy (`priceStrategyId = 2`),
matching the Scala server.
Dropping an instrument from the Add constituent context panel adds it to the
requested basket instance. Manually added constituents start with weight `0.1`,
BUY side and Limit strategy; quantity is calculated from the current basket
units. Unknown instruments, duplicates, missing baskets and on-market baskets
are rejected without changing existing rows.
The Add constituent list excludes RICs already in the active basket using a
separate full-membership subscription, including rows outside the visible grid.
Sending a basket to market and taking it off market update its constituent
statuses; live rows include `orderStatus` and an initially zero `filledQty`.
Execution fills are not simulated.

## Admin test module dependencies

The `USER_ADMIN` and `MODULE_DISCOVERY` test modules use the published
`@heswell/user-admin` and `@heswell/module-admin` packages. Standard
`npm install` setup is sufficient. Browser code imports only the browser-safe
`contracts` subpath for module-admin.