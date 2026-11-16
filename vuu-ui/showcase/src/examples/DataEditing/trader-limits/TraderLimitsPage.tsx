import { Button, Text } from "@salt-ds/core";
import { limitsModule } from "@vuu-ui/vuu-data-test";
import {
  EditableTable,
  EditableTableFooter,
  type EditableTableMode,
  exportCsvTemplate,
  TableEditorModeToggle,
  TableEditorTable,
  TableEditorToolbar,
} from "@vuu-ui/vuu-table-extras";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { EmptyStatus } from "./EmptyStatus";
import {
  TEMPLATE_COLUMNS,
  TRADER_LIMITS_TABLE,
  traderLimitRowDefaults,
  traderLimitsColumnNames,
  traderLimitsTableConfig,
} from "./trader-limits-config";
import { useLimitsImport } from "./useLimitsImport";

import "./TraderLimits.css";

export interface TraderLimitsPageProps {
  /**
   * Show a button that simulates the start of the next business day, when
   * Pending limits become Active. Only works with local data.
   */
  showNextBusinessDay?: boolean;
}

/**
 * Trader limits, created and amended during the day. New and amended limits
 * are Pending until the next business day, when they become Active.
 *
 * - Edit mode: add limits with the inline add row, amend the limit of an
 *   existing row, delete rows. Changes are applied on Save.
 * - Download a CSV template, fill it in and Import it.
 */
export const TraderLimitsPage = ({
  showNextBusinessDay = false,
}: TraderLimitsPageProps) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: traderLimitsColumnNames,
        table: TRADER_LIMITS_TABLE,
      }),
    [VuuDataSource],
  );
  const [mode, setMode] = useState<EditableTableMode>("view");
  const { chooseFile, importElements } = useLimitsImport(dataSource);

  const downloadTemplate = useCallback(() => {
    exportCsvTemplate(dataSource, {
      columns: TEMPLATE_COLUMNS,
      filename: "trader-limits-template.csv",
      onError: (err) => console.error(err.message),
    });
  }, [dataSource]);

  const EmptyDisplay = useMemo(
    () =>
      function TraderLimitsEmptyStatus() {
        return (
          <EmptyStatus
            onDownloadTemplate={downloadTemplate}
            onImport={chooseFile}
          />
        );
      },
    [chooseFile, downloadTemplate],
  );

  const isViewMode = mode === "view";

  return (
    <div className="TraderLimits">
      <Text styleAs="h2">Trader limits</Text>
      <EditableTable
        allowDelete
        dataSource={dataSource}
        mode={mode}
        onModeChange={setMode}
        rowDefaults={traderLimitRowDefaults}
      >
        <TableEditorToolbar>
          <TableEditorModeToggle />
          <div className="TraderLimits-toolbarSpacer" />
          {showNextBusinessDay ? (
            <Button
              data-testid="next-business-day"
              disabled={!isViewMode}
              onClick={() => limitsModule.activatePendingLimits()}
            >
              Next business day
            </Button>
          ) : null}
          <Button disabled={!isViewMode} onClick={downloadTemplate}>
            Download
          </Button>
          <Button disabled={!isViewMode} onClick={chooseFile}>
            Import
          </Button>
        </TableEditorToolbar>
        <TableEditorTable
          EmptyDisplay={isViewMode ? EmptyDisplay : undefined}
          config={traderLimitsTableConfig}
          showColumnHeadersWhenEmpty
          showInlineAddRow
        />
        <EditableTableFooter />
      </EditableTable>
      {importElements}
    </div>
  );
};
