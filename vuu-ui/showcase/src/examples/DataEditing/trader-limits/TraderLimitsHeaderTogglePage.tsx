import { Button, Text } from "@salt-ds/core";
import {
  DataEditingModeProvider,
  EditModeToggle,
  useDataEditing,
} from "@vuu-ui/vuu-data-editing";
import { limitsModule } from "@vuu-ui/vuu-data-test";
import { ContextPanel, type ContextPanelProps } from "@vuu-ui/vuu-shell";
import {
  type ColumnsChangeHandler,
  ColumnModel,
  ColumnPickerAction,
  DataSourceStats,
  EditableTable,
  EditableTableFooter,
  exportCsvTemplate,
  TableEditorTable,
  TableEditorToolbar,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import {
  ContextPanelProvider,
  type ShowContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import { useData, VuuShellLocation } from "@vuu-ui/vuu-utils";
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EmptyStatus } from "./EmptyStatus";
import {
  getTraderLimitsTableConfig,
  initialSelectedColumns,
  pickerColumns,
  TEMPLATE_COLUMNS,
  TRADER_LIMITS_TABLE,
  traderLimitRowDefaults,
  traderLimitsColumnNames,
} from "./trader-limits-config";
import { useLimitsImport } from "./useLimitsImport";

import "./TraderLimits.css";

export interface TraderLimitsHeaderTogglePageProps {
  /**
   * Show a button that simulates the start of the next business day, when
   * Pending limits become Active. Only works with local data.
   */
  showNextBusinessDay?: boolean;
}

const toColumnNames = (columns: readonly { name: string }[]) =>
  new Set(columns.map(({ name }) => name));

/**
 * Trader limits, created and amended during the day. New and amended limits
 * are Pending until the next business day, when they become Active.
 *
 * - Edit mode: add limits with the inline add row, amend the limit of an
 *   existing row, delete rows. Changes are applied on Save.
 * - Download a CSV template, fill it in and Import it.
 * - The column picker, from the footer, opens in the context panel.
 *
 * The View/Edit toggle is in the page header, outside the EditableTable. A
 * DataEditingModeProvider around the page holds the mode. The toggle and the
 * EditableTable both use it, and the page reads it with `useDataEditing` to
 * change the columns and disable buttons while editing.
 */
export const TraderLimitsHeaderTogglePage = (
  props: TraderLimitsHeaderTogglePageProps,
) => (
  <DataEditingModeProvider>
    <TraderLimitsHeaderToggleContent {...props} />
  </DataEditingModeProvider>
);

/** Within the DataEditingModeProvider, so it can read the mode. */
const TraderLimitsHeaderToggleContent = ({
  showNextBusinessDay = false,
}: TraderLimitsHeaderTogglePageProps) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: traderLimitsColumnNames,
        table: TRADER_LIMITS_TABLE,
      }),
    [VuuDataSource],
  );
  const { mode } = useDataEditing("TraderLimitsHeaderTogglePage");
  const { chooseFile, importElements } = useLimitsImport(dataSource);

  const [contextPanelProps, setContextPanelProps] = useState<
    ContextPanelProps | undefined
  >(undefined);
  const showContextPanel = useCallback<ShowContextPanel>((content, title) => {
    if (isValidElement(content)) {
      setContextPanelProps({ content, expanded: true, title });
    }
  }, []);
  const hideContextPanel = useCallback(() => {
    setContextPanelProps(undefined);
  }, []);

  const columnModel = useMemo(
    () => new ColumnModel(pickerColumns, initialSelectedColumns),
    [],
  );
  const [selectedColumnNames, setSelectedColumnNames] = useState(() =>
    toColumnNames(initialSelectedColumns),
  );
  useEffect(() => {
    const handleChange: ColumnsChangeHandler = (columns) =>
      setSelectedColumnNames(toColumnNames(columns));
    columnModel.on("change", handleChange);
    return () => {
      columnModel.removeListener("change", handleChange);
    };
  }, [columnModel]);

  const isViewMode = mode === "view";
  const tableConfig = useMemo(
    () => getTraderLimitsTableConfig(selectedColumnNames, !isViewMode),
    [isViewMode, selectedColumnNames],
  );

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

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <div className="TraderLimits">
        <div className="TraderLimits-main">
          <div className="TraderLimits-header">
            <Text styleAs="h2">Trader limits</Text>
            <EditModeToggle />
          </div>
          <EditableTable
            allowDelete
            dataSource={dataSource}
            rowDefaults={traderLimitRowDefaults}
          >
            <TableEditorToolbar>
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
              config={tableConfig}
              showColumnHeadersWhenEmpty
              showInlineAddRow
            />
            <EditableTableFooter>
              <DataSourceStats dataSource={dataSource} />
              <TableFooterTray>
                <ColumnPickerAction columnModel={columnModel} />
              </TableFooterTray>
            </EditableTableFooter>
          </EditableTable>
          {importElements}
        </div>
        <ContextPanel
          {...contextPanelProps}
          id={VuuShellLocation.ContextPanel}
        />
      </div>
    </ContextPanelProvider>
  );
};
