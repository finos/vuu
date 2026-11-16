import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { TraderLimitsPage } from "./trader-limits/TraderLimitsPage";

/**
 * Full page EditableTable for creating and amending trader limits. Limits are
 * entered in Edit mode with the inline add row, or imported from a CSV file
 * built from the downloadable template. Only the limit of an existing row can
 * be amended. New and amended limits are Pending until the next business
 * day; the Next business day button simulates it.
 * @title Trader limits
 */
export const TraderLimits = () => (
  <LocalDataSourceProvider>
    <TraderLimitsPage showNextBusinessDay />
  </LocalDataSourceProvider>
);
