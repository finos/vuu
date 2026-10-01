import type { Locator, Page } from "@playwright/test";
import type { GridUnderTest } from "./benchmarkPage";
import { gridTestId } from "./benchmarkPage";
import { INSTRUMENT_COLUMNS } from "../../../src/harness/instruments";

// Both grids render the same 13 columns in the same declared order
// (INSTRUMENT_COLUMNS for VUU, columnDefs for ag-grid, built from the same
// list), so a column can be found by its position in that shared order -
// no dependence on either grid's internal DOM/class structure.
const COLUMN_ORDER = INSTRUMENT_COLUMNS.map((c) => c.name);

export type GridColumn = (typeof COLUMN_ORDER)[number];

/**
 * Locates a data cell by 0-based row index (0 = first data row, header not
 * counted) and column name, on whichever grid is under test. Both VUU's
 * Table and ag-grid expose a proper ARIA grid (role="row" per row, with the
 * header itself being row 0), so this works identically for either without
 * needing grid-specific selectors.
 */
export function getCell(
  page: Page,
  grid: GridUnderTest,
  rowIndex: number,
  column: GridColumn,
): Locator {
  const columnIndex = COLUMN_ORDER.indexOf(column);
  const row = page
    .getByTestId(gridTestId(grid))
    .getByRole("row")
    .nth(rowIndex + 1);
  // VUU cells use role="cell", ag-grid data cells use role="gridcell".
  const cells = grid === "vuu" ? row.getByRole("cell") : row.getByRole("gridcell");
  return cells.nth(columnIndex);
}
