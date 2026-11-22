import { Button, Text } from "@salt-ds/core";
import {
  DataEditingModeProvider,
  EditModeToggle,
  useDataEditing,
} from "@vuu-ui/vuu-data-editing";
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
  getLimitsTableConfig,
  initialSelectedColumns,
  LIMIT_DEFINITIONS_TABLE,
  limitColumnNames,
  limitColumns,
  limitsSessionConfig,
  limitsTemplateOverrides,
} from "./trader-limits-config";
import { useLimitsImport } from "./useLimitsImport";
import { useSaveError } from "./useSaveError";

import "./TraderLimits.css";

const toColumnNames = (columns: readonly { name: string }[]) =>
  new Set(columns.map(({ name }) => name));

export interface TraderLimitsHeaderTogglePageProps {
  /**
   * Show a button that simulates the start of the next business day, when
   * Pending limits become Active.
   */
  showNextBusinessDay?: boolean;
}

/**
 * Limit definitions, one row per limit. A new limit, or a change to an
 * Active limit, is Pending until the next business day, when it becomes
 * Active.
 *
 * - Edit mode: add limits with the inline add row, change the thresholds,
 *   currency, dates and owner of a limit, delete limits. Changes are saved
 *   as Pending on Save.
 * - Download a CSV template, fill it in and Import it.
 * - The column picker, from the footer, opens in the context panel.
 *
 * The View/Edit toggle is in the page header, outside the EditableTable. A
 * DataEditingModeProvider around the page holds the mode. The toggle and the
 * EditableTable both use it, and the page reads it with `useDataEditing` to
 * disable buttons while editing.
 */
export const TraderLimitsHeaderTogglePage = ({
  showNextBusinessDay = false,
}: TraderLimitsHeaderTogglePageProps) => (
  <DataEditingModeProvider>
    <TraderLimitsHeaderToggleContent
      showNextBusinessDay={showNextBusinessDay}
    />
  </DataEditingModeProvider>
);

/** Within the DataEditingModeProvider, so it can read the mode. */
const TraderLimitsHeaderToggleContent = ({
  showNextBusinessDay,
}: Required<TraderLimitsHeaderTogglePageProps>) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: limitColumnNames,
        session: limitsSessionConfig,
        table: LIMIT_DEFINITIONS_TABLE,
      }),
    [VuuDataSource],
  );
  const activatePendingLimits = useCallback(() => {
    dataSource.rpcRequest?.({
      params: {},
      rpcName: "activatePendingLimits",
      type: "RPC_REQUEST",
    });
  }, [dataSource]);
  const { mode } = useDataEditing("TraderLimitsHeaderTogglePage");
  const { chooseFile, importElements } = useLimitsImport(dataSource);
  const saveError = useSaveError();

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
    () => new ColumnModel(limitColumns, initialSelectedColumns),
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
    () => getLimitsTableConfig(selectedColumnNames),
    [selectedColumnNames],
  );

  const downloadTemplate = useCallback(() => {
    exportCsvTemplate(dataSource, {
      filename: "limits-template.csv",
      overrides: limitsTemplateOverrides,
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
            <Text styleAs="h2">Limits</Text>
            <EditModeToggle />
          </div>
          {saveError.banner}
          <EditableTable
            allowDelete
            dataSource={dataSource}
            {...saveError.handlers}
          >
            <TableEditorToolbar>
              <div className="TraderLimits-toolbarSpacer" />
              {showNextBusinessDay ? (
                <Button
                  data-testid="next-business-day"
                  disabled={!isViewMode}
                  onClick={activatePendingLimits}
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
              className="TraderLimits-table"
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
