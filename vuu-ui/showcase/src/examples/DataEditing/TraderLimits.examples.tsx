import { TraderLimitsHeaderTogglePage } from "./trader-limits/TraderLimitsHeaderTogglePage";
import { TraderLimitsPage } from "./trader-limits/TraderLimitsPage";

/**
 * Full page EditableTableContainer for defining limits. Limits are entered in
 * Edit mode with the inline add row, or imported from a CSV file built from the
 * downloadable template. New and amended limits are Pending until the next
 * business day; the Next business day button simulates it. Edit, import and
 * export each use their own session table blueprint, defined by the LIMITS
 * module. Runs on local or remote data, as chosen in the showcase; remote data
 * needs a Vuu server with the LIMITS module. @tags data-consumer @title Trader
 * limits
 */
export const TraderLimits = () => (
  <TraderLimitsPage showNextBusinessDay />
);

/**
 * As Trader limits, with the View/Edit toggle in the page header, outside the
 * EditableTableContainer. A DataEditingModeProvider around the page holds the
 * mode, so the toggle and the table share it, and the page reads it with
 * `useDataEditing` to disable its buttons while editing. @tags data-consumer
 * @title Trader limits, toggle in page header
 */
export const TraderLimitsHeaderToggle = () => (
  <TraderLimitsHeaderTogglePage showNextBusinessDay />
);

/**
 * As Trader limits, for a first release that supports one metric: every new
 * limit is for Max order quantity, Per order, the only period it allows. The
 * Metric and Period columns stay, in the inline add row and the table,
 * showing those values, but they cannot be entered and Tab passes over them.
 * Without `fixedMetric`, any metric and period can be entered.
 * @tags data-consumer @title Trader limits, one metric
 */
export const TraderLimitsOneMetric = () => (
  <TraderLimitsPage fixedMetric="Max order quantity" showNextBusinessDay />
);

/**
 * As Trader limits, asking before Save submits changes, in a Prompt that shows
 * the changed limits, read only, and before Cancel discards unsaved changes.
 * @tags data-consumer @title Trader limits, confirm save and cancel
 */
export const TraderLimitsConfirmPrompts = () => (
  <TraderLimitsPage confirmPrompts showNextBusinessDay />
);

/**
 * As Trader limits, toggle in page header, asking before Save submits changes
 * and before Cancel discards them. @tags data-consumer @title Trader limits,
 * toggle in page header, confirm save and cancel
 */
export const TraderLimitsHeaderToggleConfirmPrompts = () => (
  <TraderLimitsHeaderTogglePage confirmPrompts showNextBusinessDay />
);
