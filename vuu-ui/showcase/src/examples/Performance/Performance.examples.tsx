import { RemoteDataSource } from "@finos/vuu-data";

import { VuuGroupBy } from "@finos/vuu-protocol-types";
import { Button } from "@salt-ds/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutoLoginToVuuServer } from "../utils/useAutoLoginToVuuServer";
import { metadataKeys } from "@finos/vuu-utils";
import { DataSourceRow } from "@finos/vuu-data-types";

import "./Performance.examples.css";

const { COUNT } = metadataKeys;

let displaySequence = 1;

const zeroCounts = (rows: DataSourceRow[]) =>
  rows.every((row) => row[COUNT] === 0);

const fullCounts = (rows: DataSourceRow[]) =>
  rows.every((row) => row[COUNT] > 0);

const isInitialTreeResponse = (message: any) => {
  return message.size === 3 && zeroCounts(message.rows);
};

const isFullTreeResponse = (message: any) => {
  return message.rows.length === 3 && fullCounts(message.rows);
};

const isClearTreeResponse = (message: any) => {
  return message.size > 100;
};

export const TreePerformance = () => {
  useAutoLoginToVuuServer();

  const [parentOrderCount, setParentOrderCount] = useState(0);
  const [childOrderCount, setChildOrderCount] = useState(0);
  const [operation, setOperation] = useState("");
  const [operationStatus, setOperationStatus] = useState("");

  const dataResolver = useRef<(value: unknown) => void | undefined>();
  const dataReceived = () =>
    new Promise((resolve) => {
      dataResolver.current = resolve;
    });

  const treeDataResolver = useRef<(value: unknown) => void | undefined>();
  const treeDataReceived = () =>
    new Promise((resolve) => {
      treeDataResolver.current = resolve;
    });

  const [dataSourceParent, dataSourceChild] = useMemo(() => {
    const dsParentOrders = new RemoteDataSource({
      bufferSize: 0,
      columns: ["id", "ric"],
      table: { table: "parentOrders", module: "SIMUL" },
    });
    dsParentOrders.subscribe({ range: { from: 0, to: 0 } }, (message) => {
      switch (message.type) {
        case "viewport-update":
          if (message.size) {
            setParentOrderCount(message.size);
          }
          break;
      }
    });

    // create a separate viewport to track childORders size, otw size is affected by groupBy, filter
    const dsChildOrdersSize = new RemoteDataSource({
      bufferSize: 0,
      columns: ["id"],
      table: { table: "childOrders", module: "SIMUL" },
    });

    dsChildOrdersSize.subscribe({ range: { from: 0, to: 20 } }, (message) => {
      if (message.type === "viewport-update" && message.size) {
        setChildOrderCount(message.size);
      }
    });

    const dsChildOrders = new RemoteDataSource({
      bufferSize: 0,
      columns: [
        "id",
        "parentOrderId",
        "ric",
        "ccy",
        "exchange",
        "quantity",
        "price",
      ],
      table: { table: "childOrders", module: "SIMUL" },
    });
    dsChildOrders.subscribe({ range: { from: 0, to: 20 } }, (message) => {
      switch (message.type) {
        case "viewport-update":
          if (message.rows) {
            if (isInitialTreeResponse(message)) {
              setOperationStatus("initial response received");
            } else if (isFullTreeResponse(message)) {
              if (typeof treeDataResolver.current === "function") {
                treeDataResolver.current(undefined);
              }
            } else if (isClearTreeResponse(message)) {
              if (typeof treeDataResolver.current === "function") {
                treeDataResolver.current(undefined);
              }
            } else if (typeof dataResolver.current === "function") {
              dataResolver.current(undefined);
              dataResolver.current = undefined;
            }
          }
          break;
      }
    });

    return [dsParentOrders, dsChildOrders];
  }, []);

  useEffect(() => {
    return () => {
      if (dataSourceParent) {
        dataSourceParent.unsubscribe();
      }
      if (dataSourceChild) {
        dataSourceChild.unsubscribe();
      }
    };
  }, [dataSourceChild, dataSourceParent]);

  const handleAddRows = useCallback(() => {
    console.log("add rows");
    dataSourceParent.menuRpcCall({
      type: "VIEW_PORT_MENUS_SELECT_RPC",
      rpcName: "ADD_1M_ROWS",
    });
  }, [dataSourceParent]);

  const handleGroupBy = useCallback(
    async (groupBy: VuuGroupBy) => {
      const startTime = performance.now();
      dataSourceChild.groupBy = groupBy;
      if (groupBy.length > 0) {
        setOperation(`group by ${groupBy.join(",")}`);
      } else {
        setOperation("clear group by");
      }
      setOperationStatus("in flight");
      await treeDataReceived();
      const endTime = performance.now();
      setOperationStatus(`took ${((endTime - startTime) / 1000).toFixed(2)} s`);
    },
    [dataSourceChild]
  );

  const handleSort = useCallback(
    async (column: string) => {
      const startTime = performance.now();
      dataSourceChild.sort = { sortDefs: [{ column, sortType: "A" }] };
      setOperation(`sort on ${column}`);
      setOperationStatus("in flight");
      await dataReceived();
      const endTime = performance.now();
      setOperationStatus(`took ${((endTime - startTime) / 1000).toFixed(2)} s`);
    },
    [dataSourceChild]
  );

  const disableButtons = operationStatus === "in flight";
  return (
    <div
      style={{ display: "flex", width: 900, height: 900, background: "yellow" }}
    >
      <div className="vuuToolbarProxy vuuToolbarProxy-vertical vuuPerfExamplesToolbar">
        <Button disabled={disableButtons} onClick={handleAddRows}>
          Add 1 Million rows
        </Button>
        <Button disabled={disableButtons} onClick={() => handleSort("ccy")}>
          Sort CCY
        </Button>
        <Button disabled={disableButtons} onClick={() => handleSort("price")}>
          Sort Price
        </Button>
        <Button
          disabled={disableButtons}
          onClick={() => handleGroupBy(["ccy"])}
        >
          GroupBy CCY
        </Button>
        <Button
          disabled={disableButtons}
          onClick={() => handleGroupBy(["ccy", "exchange"])}
        >
          GroupBy CCY, Exchange
        </Button>
        <Button
          disabled={disableButtons}
          onClick={() => handleGroupBy(["ccy", "exchange", "ric"])}
        >
          GroupBy CCY, Exchange, Ric
        </Button>
        <Button disabled={disableButtons} onClick={() => handleGroupBy([])}>
          Clear GroupBy
        </Button>
      </div>
      <div style={{ padding: 12 }}>
        <div>Parent Orders: {parentOrderCount}</div>
        <div>Child Orders: {childOrderCount}</div>
        <div>
          {operation} {operationStatus}
        </div>
      </div>
    </div>
  );
};
TreePerformance.displaySequence = displaySequence++;
