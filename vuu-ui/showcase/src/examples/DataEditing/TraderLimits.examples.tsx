import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { TraderLimitsHeaderTogglePage } from "./trader-limits/TraderLimitsHeaderTogglePage";
import { TraderLimitsPage } from "./trader-limits/TraderLimitsPage";

/**
 * Full page EditableTable for defining limits. Limits are entered in Edit
 * mode with the inline add row, or imported from a CSV file built from the
 * downloadable template. Changes go through maker-checker: new and amended
 * limits are Pending until they are approved. Edit, import and export each
 * use their own session table blueprint, defined by the LIMITS module.
 * @title Trader limits
 */
export const TraderLimits = () => (
  <LocalDataSourceProvider>
    <TraderLimitsPage />
  </LocalDataSourceProvider>
);

/**
 * As Trader limits, with the View/Edit toggle in the page header, outside
 * the EditableTable. A DataEditingModeProvider around the page holds the
 * mode, so the toggle and the table share it, and the page reads it with
 * `useDataEditing` to disable its buttons while editing.
 * @title Trader limits, toggle in page header
 */
export const TraderLimitsHeaderToggle = () => (
  <LocalDataSourceProvider>
    <TraderLimitsHeaderTogglePage />
  </LocalDataSourceProvider>
);
