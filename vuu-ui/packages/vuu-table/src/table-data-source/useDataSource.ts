import type {
  DataSource,
  DataSourceConfigChangeHandler,
  DataSourceRow,
  DataSourceSubscribeCallback,
  DataSourceSubscribedMessage,
  DataSourceSuspenseProps,
  RangeLimits,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import type { SelectRowRequest, VuuRange } from "@vuu-ui/vuu-protocol-types";
import { Range } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TableProps } from "../Table";
import type {
  DataRow,
  TableRowSelectHandlerInternal,
} from "@vuu-ui/vuu-table-types";
import { DataRowMovingWindow } from "./DataRowMovingWindow";
import { dataRowFactory, type DataRowFunc } from "../data-row/DataRow";

const NullDataRow = () => ({}) as DataRow;

const defaultRangeLimits = {
  maxRangeEnd: Number.MAX_SAFE_INTEGER,
  maxRangeWidth: Number.MAX_SAFE_INTEGER,
};

type DataSourceBinding = {
  dataRow: DataRowFunc;
  dataRows: { current: DataRow[] };
  dataRowWindow: DataRowMovingWindow;
  dataSource: DataSource;
  isReplacement: boolean;
  range: Range;
  rangeLimits: RangeLimits;
  rangeRequested: boolean;
  rowAutoSelected: boolean;
  pendingRows: DataSourceRow[];
  setColumns?: (columns: string[]) => void;
};

export interface DataSourceHookProps
  extends Pick<
    TableProps,
    | "autoSelectFirstRow"
    | "autoSelectRowKey"
    | "dataSource"
    | "renderBufferSize"
    | "revealSelected"
    | "selectionModel"
  > {
  suspenseProps?: DataSourceSuspenseProps;
  onSelect: TableRowSelectHandlerInternal;
  /**
   * Invoked whenever rowCount changes. For example when rows are added
   * or removed from source table. RowCount will also change if filter(s)
   * or grouping are applied.
   *
   * @param size - the rowCount for current dataSource (reflecting filtering etc).
   * @param maxRangeEnd - a scroll limit that may be imposed by server. Requesting
   * a range beyond this point will error.
   */
  onSizeChange: (size: number, maxRangeEnd: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
}

export const useDataSource = ({
  autoSelectFirstRow,
  autoSelectRowKey,
  dataSource,
  onSizeChange,
  onSubscribed,
  renderBufferSize = 0,
  revealSelected,
  onSelect,
  selectionModel,
  suspenseProps,
}: DataSourceHookProps) => {
  const [, forceUpdate] = useState<unknown>(null);
  const isMounted = useRef(true);
  const previousBindingRef = useRef<DataSourceBinding | undefined>(undefined);
  const previousBinding = previousBindingRef.current;
  const binding: DataSourceBinding =
    previousBinding?.dataSource === dataSource
      ? previousBinding
      : (() => {
          // Keep the table's visible viewport, but require the new datasource
          // generation to establish that range independently.
          const previousRange = previousBinding?.range ?? dataSource.range;
          const range = Range(
            previousRange.from,
            previousRange.to,
            renderBufferSize,
          );
          const tableSchema = dataSource.tableSchema;
          const [dataRow, setColumns] = tableSchema
            ? dataRowFactory(dataSource.columns, tableSchema.columns)
            : [NullDataRow, undefined];

          return {
            dataRow,
            dataRows: { current: [] },
            dataRowWindow: new DataRowMovingWindow(range.withBuffer),
            dataSource,
            isReplacement:
              previousBinding !== undefined &&
              previousBinding.dataSource !== dataSource,
            range,
            rangeLimits: { ...defaultRangeLimits },
            rangeRequested: false,
            rowAutoSelected: false,
            pendingRows: [],
            setColumns,
          };
        })();
  previousBindingRef.current = binding;

  const activeBindingRef = useRef<DataSourceBinding | undefined>(binding);
  activeBindingRef.current = binding;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const autoSelect =
    autoSelectRowKey ??
    (autoSelectFirstRow || selectionModel === "single-no-deselect");

  const handleConfigChange = useCallback<DataSourceConfigChangeHandler>(
    (_config, _range, _confirmed, configChanges) => {
      if (activeBindingRef.current !== binding) {
        return;
      }
      if (configChanges?.filterChanged) {
        binding.rowAutoSelected = false;
      }
    },
    [binding],
  );

  useEffect(() => {
    if (autoSelect) {
      dataSource.on("config", handleConfigChange);
    }
    return () => {
      if (autoSelect) {
        dataSource.removeListener("config", handleConfigChange);
      }
    };
  }, [autoSelect, dataSource, handleConfigChange]);

  const handleResume = useCallback(() => {
    if (activeBindingRef.current !== binding) {
      return;
    }
    // When we resume a dataSource (after switching tabs etc)
    // client will receive rows. We may not have received any
    // setRange calls at this point so dataWindow range will
    //not yet be set. If the dataWindow range is already set,
    // this is a no-op.
    const { range } = dataSource;
    if (range.to !== 0) {
      binding.dataRowWindow.setRange(dataSource.range.withBuffer);
    }
  }, [binding, dataSource]);

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      if (activeBindingRef.current !== binding) {
        return;
      }
      for (const row of updates) {
        // for now, we create a new DataRow each time
        binding.dataRowWindow.add(binding.dataRow(row));
      }
      binding.dataRows.current = binding.dataRowWindow.data;
      if (isMounted.current) {
        // TODO do we ever need to worry about missing updates here ?
        forceUpdate({});
      }
    },
    [binding],
  );

  const selectRow = useCallback(
    (dataRow: DataRow) => {
      const rowKey = dataRow.key;
      binding.dataSource.select?.({
        preserveExistingSelection: false,
        rowKey,
        type: "SELECT_ROW",
      } as SelectRowRequest);
      onSelect?.(dataRow);
    },
    [binding, onSelect],
  );

  /**
   * Use the dataRowFactory to build a custom DataRow. It will use
   * the schema columns to correctly interpret data values from the
   * underlying Vuu array row structure.
   */
  const createDataRow = useCallback(
    (columns: string[], schemaColumns: readonly SchemaColumn[]) => {
      const [DataRow, setColumns] = dataRowFactory(columns, schemaColumns);
      binding.dataRow = DataRow;
      binding.setColumns = setColumns;
    },
    [binding],
  );

  const datasourceMessageHandler: DataSourceSubscribeCallback = useCallback(
    (message) => {
      if (activeBindingRef.current !== binding) {
        return;
      }
      if (message.type === "subscribed") {
        createDataRow(message.columns, message.tableSchema.columns);
        if (binding.pendingRows.length > 0) {
          setData(binding.pendingRows);
          binding.pendingRows = [];
        }
        if (message.tableSchema.rangeLimits) {
          binding.rangeLimits = message.tableSchema.rangeLimits;
        }
        onSubscribed?.(message);
      } else if (message.type === "subscribe-failed") {
        console.warn(`subscribe failed ${message.msg}`);
      } else if (message.type === "viewport-update") {
        if (typeof message.size === "number") {
          onSizeChange?.(message.size, binding.rangeLimits.maxRangeEnd);
          // const size = dataRowWindow.data.length;
          binding.dataRowWindow.setRowCount(message.size);
        }
        if (message.rows) {
          if (binding.setColumns === undefined) {
            binding.pendingRows.push(...message.rows);
          } else {
            setData(message.rows);
          }
          if (autoSelect && binding.rowAutoSelected === false) {
            // OR if no selected row in message.rows, e.g after a filter
            binding.rowAutoSelected = true;
            if (typeof autoSelect === "string") {
              const dataRow = binding.dataRowWindow.getByKey(autoSelect);
              if (dataRow) {
                selectRow(dataRow);
              } else {
                console.warn(
                  `[useDataSource] autoSelect row key ${autoSelect} not in viewport`,
                );
              }
            } else if (binding.dataRowWindow.hasData) {
              selectRow(binding.dataRowWindow.firstRow);
            }
          }
        } else if (message.size === 0) {
          setData([]);
        } else if (typeof message.size === "number") {
          binding.dataRows.current = binding.dataRowWindow.data;
        }
      } else if (message.type === "viewport-clear") {
        onSizeChange?.(0, binding.rangeLimits.maxRangeEnd);
        binding.dataRowWindow.setRowCount(0);
        setData([]);
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [
      autoSelect,
      binding,
      createDataRow,
      onSizeChange,
      onSubscribed,
      selectRow,
      setData,
    ],
  );

  const getSelectedRows = useCallback(() => {
    return binding.dataRowWindow.getSelectedRows();
  }, [binding]);

  useEffect(() => {
    binding.setColumns?.(dataSource.columns);
  }, [binding, dataSource.columns]);

  const setRange = useCallback(
    (viewportRange: VuuRange) => {
      if (
        binding.rangeRequested === false ||
        !binding.range.equals(viewportRange)
      ) {
        const range = Range(
          viewportRange.from,
          viewportRange.to,
          renderBufferSize,
        );

        binding.range = range;
        binding.rangeRequested = true;
        binding.dataRowWindow.setRange(range.withBuffer);

        if (
          dataSource.status === "initialising" ||
          dataSource.status === "unsubscribed"
        ) {
          dataSource?.subscribe(
            {
              range,
              revealSelected,
              selectedKeyValues: autoSelectRowKey
                ? [autoSelectRowKey]
                : undefined,
            },
            datasourceMessageHandler,
          );
        } else {
          dataSource.range = range;
        }
      }
    },
    [
      autoSelectRowKey,
      binding,
      dataSource,
      datasourceMessageHandler,
      renderBufferSize,
      revealSelected,
    ],
  );

  useEffect(() => {
    activeBindingRef.current = binding;
    const status = dataSource.status;
    const shouldRestoreRange =
      binding.isReplacement && binding.rangeRequested === false;
    if (shouldRestoreRange) {
      onSizeChange(0, defaultRangeLimits.maxRangeEnd);
    }
    dataSource.on("resumed", handleResume);

    if (status !== "initialising" && status !== "unsubscribed") {
      const { columns, tableSchema } = dataSource;
      if (tableSchema) {
        createDataRow(columns, tableSchema.columns);
      } else {
        throw Error(
          "[useDataSource] a resumed dataSource must have a tableSchema",
        );
      }
    }

    if (shouldRestoreRange) {
      setRange(binding.range);
    }

    if (status === "disabled" || status === "disabling") {
      dataSource.enable?.(datasourceMessageHandler);
    } else if (
      status !== "initialising" &&
      status !== "unsubscribed" &&
      status !== "subscribing" &&
      status !== "enabling"
    ) {
      dataSource.resume?.(datasourceMessageHandler);

      if (!binding.isReplacement && dataSource.range.from > 0) {
        // UI does not currently restore scroll position, so always reset to top of dataset
        const { from, to } = binding.range.reset;
        setRange({ from, to });
      }
    }

    return () => {
      const replacementDataSource = activeBindingRef.current?.dataSource;
      const isOwnSessionReplacement =
        replacementDataSource?.isSessionDataSourceOf?.(dataSource) === true;
      if (activeBindingRef.current === binding) {
        activeBindingRef.current = undefined;
      }
      dataSource.removeListener("resumed", handleResume);
      dataSource.suspend?.(
        isOwnSessionReplacement ? false : suspenseProps?.escalateToDisable,
        suspenseProps?.escalateDelay,
      );
    };
  }, [
    binding,
    createDataRow,
    dataSource,
    datasourceMessageHandler,
    handleResume,
    onSizeChange,
    setRange,
    suspenseProps?.escalateDelay,
    suspenseProps?.escalateToDisable,
  ]);

  return {
    dataRows: binding.dataRows.current,
    dataRowsRef: binding.dataRows,
    getSelectedRows,
    range: binding.range,
    setRange,
  };
};
