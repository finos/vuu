import type {
  DataSourceConfigChangeHandler,
  DataSourceRow,
  DataSourceSubscribeCallback,
  DataSourceSubscribedMessage,
  DataSourceSuspenseProps,
} from "@vuu-ui/vuu-data-types";
import { SelectRowRequest, VuuRange } from "@vuu-ui/vuu-protocol-types";
import { MovingWindow, NULL_RANGE, Range } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableProps } from "./Table";
import { metadataKeys } from "@vuu-ui/vuu-utils";
import { TableRowSelectHandlerInternal } from "@vuu-ui/vuu-table-types";

const { KEY } = metadataKeys;

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
  const data = useRef<DataSourceRow[]>([]);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rangeRef = useRef<Range>(NULL_RANGE);
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

  const dataWindow = useMemo(
    () => new MovingWindow(NULL_RANGE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        dataWindow.setRange(dataSource.range);
      }
    });
  }, [dataSource, dataWindow]);

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      for (const row of updates) {
        dataWindow.add(row);
      }
      data.current = dataWindow.data;
      if (isMounted.current) {
        // TODO do we ever need to worry about missing updates here ?
        forceUpdate({});
      }
    },
    [dataWindow],
  );

  const selectRow = useCallback(
    (row: DataSourceRow) => {
      const rowKey = row[KEY];
      dataSource.select?.({
        preserveExistingSelection: false,
        rowKey,
        type: "SELECT_ROW",
      } as SelectRowRequest);
      onSelect?.(row);
    },
    [dataSource, onSelect],
  );

  const datasourceMessageHandler: DataSourceSubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        onSubscribed?.(message);
      } else if (message.type === "viewport-update") {
        if (typeof message.size === "number") {
          onSizeChange?.(message.size);
          const size = dataWindow.data.length;
          dataWindow.setRowCount(message.size);
          totalRowCountRef.current = message.size;

          if (dataWindow.data.length < size) {
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
              const row = message.rows.find((row) => row[KEY] === autoSelect);
              if (row) {
                selectRow(row);
              } else {
                console.warn(
                  `[useDataSource] autoSelect row key ${autoSelect} not in viewport`,
                );
              }
            } else {
              selectRow(message.rows[0]);
            }
          }
        } else if (message.size === 0) {
          setData([]);
        } else if (typeof message.size === "number") {
          data.current = dataWindow.data;
          hasUpdated.current = true;
        }
      } else if (message.type === "viewport-clear") {
        onSizeChange?.(0);
        dataWindow.setRowCount(0);
        setData([]);

        if (isMounted.current === false) {
          console.log("setting state whilst unmounted");
        }

        forceUpdate({});
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [autoSelect, dataWindow, onSizeChange, onSubscribed, selectRow, setData],
  );

  const getSelectedRows = useCallback(() => {
    return dataWindow.getSelectedRows();
  }, [dataWindow]);

  useEffect(() => {
    isMounted.current = true;
    if (dataSource.status !== "initialising") {
      dataSource.resume?.(datasourceMessageHandler);
    }
    return () => {
      isMounted.current = false;
      dataSource.suspend?.(
        suspenseProps?.escalateToDisable,
        suspenseProps?.escalateDelay,
      );
    };
  }, [dataSource, datasourceMessageHandler, suspenseProps]);

  useEffect(() => {
    if (dataSource.status === "disabled") {
      dataSource.enable?.(datasourceMessageHandler);
    }
  }, [dataSource, datasourceMessageHandler]);

  const setRange = useCallback(
    (viewportRange: VuuRange) => {
      if (!rangeRef.current.equals(viewportRange)) {
        const range = Range(viewportRange.from, viewportRange.to, {
          renderBufferSize,
          rowCount: totalRowCountRef.current,
        });

        dataWindow.setRange(range);

        if (dataSource.status !== "subscribed") {
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
      dataSource,
      dataWindow,
      datasourceMessageHandler,
      renderBufferSize,
      revealSelected,
    ],
  );

  const removeColumnDataFromCache = useCallback(
    (indexOfRemovedColumn: number) => {
      dataWindow.spliceDataAtIndex(indexOfRemovedColumn);
      data.current = dataWindow.data;
    },
    [dataWindow],
  );

  return {
    data: data.current,
    dataRef: data,
    getSelectedRows,
    range: rangeRef.current,
    removeColumnDataFromCache,
    setRange,
  };
};
