import type { ColDef } from "ag-grid-community";
import type { InstrumentRow } from "../harness/instruments";

// Shared by both ag-grid variants (client-side row model and Server-Side Row
// Model) so column configuration itself is never a variable between them.
export const columnDefs: ColDef<InstrumentRow>[] = [
  { field: "ric", width: 130, filter: true },
  { field: "symbol", width: 90, filter: true },
  { field: "name", width: 220, filter: true },
  { field: "exchange", width: 90, filter: true },
  { field: "currency", width: 80, filter: true },
  // enableCellChangeFlash mirrors VUU's vuu.price-move-background renderer -
  // all grids visually flash changed cells, so that rendering cost is part
  // of what gets measured everywhere, not just on VUU's side.
  { field: "bid", width: 100, filter: true, enableCellChangeFlash: true },
  { field: "ask", width: 100, filter: true, enableCellChangeFlash: true },
  { field: "last", width: 100, enableCellChangeFlash: true },
  { field: "bidSize", width: 100 },
  { field: "askSize", width: 100 },
  { field: "open", width: 100 },
  { field: "volume", width: 120 },
  { field: "changePercent", width: 110 },
];
