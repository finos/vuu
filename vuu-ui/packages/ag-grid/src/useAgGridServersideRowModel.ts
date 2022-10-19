import { RemoteDataSource, SubscribeCallback } from "@vuu-ui/data-remote";
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
  LoadSuccessParams,
} from "ag-grid-community";
import { useCallback, useMemo, useRef } from "react";
import { convertToAgGridDataRows } from "./AgGridDataUtils";

type AgGridSuccess = (params: LoadSuccessParams) => void;

export const useAgGridServersideRowModel = (dataSourceConfig) => {
  const rowCountRef = useRef(0);
  const agGridSuccessRef = useRef<AgGridSuccess>();

  const handleMessageFromDataSource: SubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        console.log("subscribed");
      } else if (message.type === "viewport-update") {
        if (message.size !== undefined) {
          if (message.size !== rowCountRef.current) {
            rowCountRef.current = message.size;
            console.log(`rowCount = ${rowCountRef.current}`);
            //   this.setRowCount(message.size);
          }
        }
        if (message.rows) {
          const rows = convertToAgGridDataRows(message.rows);
          agGridSuccessRef.current?.({
            rowData: rows,
            rowCount: rowCountRef.current,
          });
        } else if (message.size !== undefined) {
          // console.log("got a size message");
        }
      }
    },
    []
  );

  const dataSource = useMemo(() => {
    const vuuDataSource = new RemoteDataSource(dataSourceConfig);
    vuuDataSource.subscribe(
      {
        range: { from: 0, to: 0 },
      },
      handleMessageFromDataSource
    );
    return vuuDataSource;
    // TODO cleanup in return callback
  }, []);

  const getRows = useCallback((params: IServerSideGetRowsParams<any>): void => {
    const { fail, parentNode, request, success } = params;

    agGridSuccessRef.current = success;
    console.log(
      `%cAgGrid is asking for rows`,
      "color: blue; font-size: bold;",
      {
        request,
      }
    );

    const {
      startRow = 0,
      endRow = 1000,
      filterModel,
      groupKeys,
      rowGroupCols,
    } = request;
    const hasFilter = Object.keys(filterModel).length > 0;

    dataSource.setRange(startRow, endRow);
  }, []);

  return {
    getRows,
  } as IServerSideDatasource;
};
