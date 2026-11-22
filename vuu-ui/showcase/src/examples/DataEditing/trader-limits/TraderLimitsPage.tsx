import { Button, Text } from "@salt-ds/core";
import { ContextPanel, type ContextPanelProps } from "@vuu-ui/vuu-shell";
import {
  type ColumnsChangeHandler,
  ColumnModel,
  ColumnPickerAction,
  DataSourceStats,
  EditableTable,
  EditableTableFooter,
  type EditableTableMode,
  exportCsvTemplate,
  TableEditorModeToggle,
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

/**
 * Limit definitions, one row per limit. Changes go through maker-checker:
 * a new limit, or a change to an Active limit, is Pending until it is
 * approved.
 *
 * - Edit mode: add limits with the inline add row, change the thresholds,
 *   currency, dates and owner of a limit, delete limits. Changes are sent
 *   for approval on Save.
 * - Approve or Reject the selected Pending limits.
 * - Download a CSV template, fill it in and Import it.
 * - The column picker, from the footer, opens in the context panel.
 *
 * The View/Edit toggle is in the table's toolbar. The page holds the mode and
 * passes it to the EditableTable, so it can disable buttons while editing.
 */
export const TraderLimitsPage = () => {
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
  const [mode, setMode] = useState<EditableTableMode>("view");
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

  const approveOrReject = useCallback(
    (rpcName: "approveLimits" | "rejectLimits") =>
      dataSource.rpcRequest?.({ params: {}, rpcName, type: "RPC_REQUEST" }),
    [dataSource],
  );

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
          </div>
          {saveError.banner}
          <EditableTable
            allowDelete
            dataSource={dataSource}
            {...saveError.handlers}
            mode={mode}
            onModeChange={setMode}
          >
            <TableEditorToolbar>
              <TableEditorModeToggle />
              <div className="TraderLimits-toolbarSpacer" />
              <Button
                data-testid="approve-limits"
                disabled={!isViewMode}
                onClick={() => approveOrReject("approveLimits")}
              >
                Approve
              </Button>
              <Button
                data-testid="reject-limits"
                disabled={!isViewMode}
                onClick={() => approveOrReject("rejectLimits")}
              >
                Reject
              </Button>
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
              selectionModel="checkbox"
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
