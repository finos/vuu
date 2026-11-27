import { useComponentCssInjection } from "@salt-ds/styles";
import cx from "clsx";
import { useWindow } from "@salt-ds/window";
import {
  getEditableColumns,
  type useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource, DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { isTextColumnInSchema, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import {
  ConfirmPrompt,
  type ConfirmPromptProps,
  usePromptRequest,
} from "./ConfirmPrompt";

import confirmSubmitCss from "./ConfirmSubmit.css";

/** The Prompt shown when the user saves the changes of an edit session. */
export interface ConfirmSubmitOptions extends ConfirmPromptProps {
  /**
   * The table of changed rows. Defaults to the columns of the
   * `EditableTable`. Every column is shown read only.
   */
  config?: TableConfig;
  /** What a row is, used in the default `message`. @default "row" */
  entityName?: string;
  /** @default "info-circle" */
  icon?: string;
  /** @default "Are you sure you want to change the following <entityName>s" */
  message?: ConfirmPromptProps["message"];
  /** @default "Submit changes" */
  title?: string;
}

const classBase = "vuuConfirmSubmit";

type EditableTableState = ReturnType<typeof useEditableTable>;

const formatKey = (key: string, quoted: boolean) =>
  quoted ? JSON.stringify(key) : key;

const NO_COLUMNS: readonly DataValueDescriptor[] = [];

/** The Table suspends the data source when it unmounts, unsubscribe after. */
const unsubscribeLater = (dataSource: DataSource) =>
  setTimeout(() => {
    if (
      dataSource.status !== "unsubscribed" &&
      dataSource.status !== "initialising"
    ) {
      dataSource.unsubscribe();
    }
  }, 0);

/**
 * Asks the user to confirm saving the changes of an edit session, in a
 * Prompt that shows the changed rows. Returns `confirmSave`, for
 * `EditButtons`, and the Prompt, to render within the edit session's
 * `DataEditingProvider`.
 */
export const useConfirmSubmit = (
  options: boolean | ConfirmSubmitOptions | undefined,
  editableTable: EditableTableState,
  columns: readonly DataValueDescriptor[] = NO_COLUMNS,
) => {
  const { VuuDataSource } = useData();
  const { ask, request, settle } = usePromptRequest(unsubscribeLater);
  const { editSchema, editSession, rowClassNameGenerators, sessionDataSource } =
    editableTable;

  const {
    cancelButtonLabel = "Cancel",
    className,
    config,
    confirmButtonLabel = "Confirm",
    entityName = "row",
    icon = "info-circle",
    message = `Are you sure you want to change the following ${entityName}s`,
    title = "Submit changes",
  } = typeof options === "object" ? options : {};

  const confirmSave = useCallback(async () => {
    const keyColumn = editSchema?.key;
    const table = sessionDataSource?.table;
    if (
      editSchema === undefined ||
      keyColumn === undefined ||
      table === undefined
    ) {
      return true;
    }
    const quoted = isTextColumnInSchema(editSchema, keyColumn);
    const keys = editSession.changedRowKeys.map((key) =>
      formatKey(key, quoted),
    );
    return ask(
      new VuuDataSource({
        columns: sessionDataSource?.columns,
        filterSpec: { filter: `${keyColumn} in [${keys.join(",")}]` },
        table,
      }),
    );
  }, [VuuDataSource, ask, editSchema, editSession, sessionDataSource]);

  const tableConfig = useMemo<TableConfig>(() => {
    const readOnlyColumns = getEditableColumns({
      columns: (config?.columns ?? columns) as ColumnDescriptor[],
      isEditing: false,
      schema: editSchema,
    });
    const hasActionColumn =
      editSchema?.columns.some(({ name }) => name === "vuuAction") &&
      !readOnlyColumns.some(({ name }) => name === "vuuAction");
    return {
      ...config,
      columns: hasActionColumn
        ? readOnlyColumns.concat({
            hidden: true,
            name: "vuuAction",
            serverDataType: "string",
          })
        : readOnlyColumns,
      rowClassNameGenerators: (config?.rowClassNameGenerators ?? []).concat(
        rowClassNameGenerators ?? [],
      ),
    };
  }, [columns, config, editSchema, rowClassNameGenerators]);

  const prompt =
    options && request ? (
      <ConfirmSubmitPrompt
        cancelButtonLabel={cancelButtonLabel}
        className={className}
        confirmButtonLabel={confirmButtonLabel}
        config={tableConfig}
        dataSource={request.value}
        icon={icon}
        message={message}
        onSettle={settle}
        title={title}
      />
    ) : null;

  return { confirmSave: options ? confirmSave : undefined, prompt };
};

interface ConfirmSubmitPromptProps
  extends Required<
    Omit<ConfirmSubmitOptions, "className" | "config" | "entityName">
  > {
  className?: string;
  config: TableConfig;
  dataSource: DataSource;
  onSettle: (confirmed: boolean) => void;
}

const ConfirmSubmitPrompt = ({
  className,
  config,
  dataSource,
  message,
  ...promptProps
}: ConfirmSubmitPromptProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-confirm-submit",
    css: confirmSubmitCss,
    window: targetWindow,
  });
  return (
    <ConfirmPrompt
      {...promptProps}
      className={cx(classBase, className)}
      testId="confirm-submit"
    >
      <div className={`${classBase}-content`}>
        <span className={`${classBase}-message`}>{message}</span>
        <Table
          className={`${classBase}-table`}
          config={config}
          dataSource={dataSource}
          height="var(--vuuConfirmSubmit-tableHeight, 240px)"
          renderBufferSize={10}
          selectionModel="none"
        />
      </div>
    </ConfirmPrompt>
  );
};
