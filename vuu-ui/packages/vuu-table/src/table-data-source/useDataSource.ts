import type {
  DataSourceConfigChangeHandler,
  DataSourceRow,
  DataSourceSubscribeCallback,
  DataSourceSubscribedMessage,
  DataSourceSuspenseProps,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import { SelectRowRequest, VuuRange } from "@vuu-ui/vuu-protocol-types";
import { Range } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableProps } from "../Table";
import {
  DataRow,
  TableRowSelectHandlerInternal,
} from "@vuu-ui/vuu-table-types";
import { MovingDataRowWindow } from "./DataRowMovingWindow";
import { dataRowFactory, DataRowFunc } from "../data-row/DataRow";

const NullDataRow = () => ({}) as DataRow;

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
  onSizeChange: (size: number) => void;
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
  const dataRows = useRef<DataRow[]>([]);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rangeRef = useRef<Range>(dataSource.range);
  const dataRowRef = useRef<DataRowFunc>(NullDataRow);
  const setColumnsRef = useRef<undefined | ((columns: string[]) => void)>(
    undefined,
  );
  const totalRowCountRef = useRef(0);
  const rowAutoSelected = useRef(false);

  const autoSelect =
    autoSelectRowKey ??
    (autoSelectFirstRow || selectionModel === "single-no-deselect");

  const handleConfigChange = useCallback<DataSourceConfigChangeHandler>(
    (_config, _range, _confirmed, configChanges) => {
      if (configChanges?.filterChanged) {
        rowAutoSelected.current = false;
      }
    },
    [],
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

  const dataRowWindow = useMemo(
    () => new MovingDataRowWindow(rangeRef.current.withBuffer),
    [],
  );

  useMemo(() => {
    dataSource.on("resumed", () => {
      // When we resume a dataSource (after switching tabs etc)
      // client will receive rows. We may not have received any
      // setRange calls at this point so dataWindow range will
      //not yet be set. If the dataWindow range is already set,
      // this is a no-op.
      const { range } = dataSource;
      if (range.to !== 0) {
        dataRowWindow.setRange(dataSource.range.withBuffer);
      }
    });
  }, [dataRowWindow, dataSource]);

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      const { current: DataRow } = dataRowRef;
      for (const row of updates) {
        // for now, we create a new DataRow each time
        dataRowWindow.add(DataRow(row));
      }
      dataRows.current = dataRowWindow.data;
      if (isMounted.current) {
        // TODO do we ever need to worry about missing updates here ?
        forceUpdate({});
      }
    },
    [dataRowWindow],
  );

  const selectRow = useCallback(
    (dataRow: DataRow) => {
      const rowKey = dataRow.key;
      dataSource.select?.({
        preserveExistingSelection: false,
        rowKey,
        type: "SELECT_ROW",
      } as SelectRowRequest);
      onSelect?.(dataRow);
    },
    [dataSource, onSelect],
  );

  const createDataRow = useCallback(
    (columns: string[], schemaColumns: readonly SchemaColumn[]) => {
      const [DataRow, setColumns] = dataRowFactory(columns, schemaColumns);
      dataRowRef.current = DataRow;
      setColumnsRef.current = setColumns;
    },
    [],
  );

  const datasourceMessageHandler: DataSourceSubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        createDataRow(message.columns, message.tableSchema.columns);
        onSubscribed?.(message);
      } else if (message.type === "viewport-update") {
        if (typeof message.size === "number") {
          onSizeChange?.(message.size);
          const size = dataRowWindow.data.length;
          dataRowWindow.setRowCount(message.size);
          totalRowCountRef.current = message.size;

          if (dataRowWindow.data.length < size) {
            if (isMounted.current === false) {
              console.log("setting state whilst unmounted");
            }

            forceUpdate({});
          }
        }
        if (message.rows) {
          setData(message.rows);
          if (autoSelect && rowAutoSelected.current === false) {
            // OR if no selected row in message.rows, e.g after a filter
            rowAutoSelected.current = true;
            if (typeof autoSelect === "string") {
              const dataRow = dataRowWindow.getByKey(autoSelect);
              if (dataRow) {
                selectRow(dataRow);
              } else {
                console.warn(
                  `[useDataSource] autoSelect row key ${autoSelect} not in viewport`,
                );
              }
            } else if (dataRowWindow.hasData) {
              selectRow(dataRowWindow.firstRow);
            }
          }
        } else if (message.size === 0) {
          setData([]);
        } else if (typeof message.size === "number") {
          dataRows.current = dataRowWindow.data;
          hasUpdated.current = true;
        }
      } else if (message.type === "viewport-clear") {
        onSizeChange?.(0);
        dataRowWindow.setRowCount(0);
        setData([]);

        if (isMounted.current === false) {
          console.log("setting state whilst unmounted");
        }

        forceUpdate({});
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [
      autoSelect,
      createDataRow,
      dataRowWindow,
      onSizeChange,
      onSubscribed,
      selectRow,
      setData,
    ],
  );

  const getSelectedRows = useCallback(() => {
    return dataRowWindow.getSelectedRows();
  }, [dataRowWindow]);

  useEffect(() => {
    if (dataSource.status === "disabled") {
      dataSource.enable?.(datasourceMessageHandler);
    }
  }, [dataSource, datasourceMessageHandler]);

  useMemo(() => {
    setColumnsRef.current?.(dataSource.columns);
  }, [dataSource.columns]);

  const setRange = useCallback(
    (viewportRange: VuuRange) => {
      if (!rangeRef.current.equals(viewportRange)) {
        const range = Range(
          viewportRange.from,
          viewportRange.to,
          renderBufferSize,
        );

        dataRowWindow.setRange(range.withBuffer);

        if (
          dataSource.status !== "subscribed" &&
          dataSource.status !== "subscribing" &&
          dataSource.status !== "enabling"
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
          dataSource.range = rangeRef.current = range;
        }
      }
    },
    [
      autoSelectRowKey,
      dataRowWindow,
      dataSource,
      datasourceMessageHandler,
      renderBufferSize,
      revealSelected,
    ],
  );

  useEffect(() => {
    isMounted.current = true;
    if (dataSource.status !== "initialising") {
      const { columns, tableSchema } = dataSource;
      if (tableSchema) {
        createDataRow(columns, tableSchema.columns);
      } else {
        throw Error(
          `[useDataSource] a resumed dataSource must have a tableSchema`,
        );
      }

      dataSource.resume?.(datasourceMessageHandler);

      if (dataSource.range.from > 0) {
        // UI does not currently restore scroll position, so always reset to top of dataset
        const { from, to } = rangeRef.current.reset;
        setRange({ from, to });
      }
    }
    return () => {
      isMounted.current = false;
      dataSource.suspend?.(
        suspenseProps?.escalateToDisable,
        suspenseProps?.escalateDelay,
      );
    };
  }, [
    createDataRow,
    dataSource,
    datasourceMessageHandler,
    setRange,
    suspenseProps,
  ]);

  return {
    dataRows: dataRows.current,
    dataRowsRef: dataRows,
    getSelectedRows,
    range: rangeRef.current,
    setRange,
  };
};
