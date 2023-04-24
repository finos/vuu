import { RemoteDataSource } from "@finos/vuu-data";
import { VuuGroupBy } from "@finos/vuu-protocol-types";
import { Toolbar } from "@heswell/salt-lab";
import { Button } from "@salt-ds/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutoLoginToVuuServer } from "../utils/useAutoLoginToVuuServer";

import "./Performance.examples.css";

let displaySequence = 1;

const isTreeResponse = (message: any) => {
  return message.size === 3;
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
  const [responseTime, setResponseTime] = useState(0);

  const treeDataResolver = useRef<(value: unknown) => void | undefined>();
  const treeDataReceived = () =>
    new Promise((resolve) => {
      treeDataResolver.current = resolve;
    });
  const treeDataCleared = () =>
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
          if (message.size) {
            setChildOrderCount(message.size);
          }
          if (message.rows) {
            if (isTreeResponse(message)) {
              if (typeof treeDataResolver.current === "function") {
                treeDataResolver.current(undefined);
              }
            } else if (isClearTreeResponse(message)) {
              if (typeof treeDataResolver.current === "function") {
                treeDataResolver.current(undefined);
              }
            }
          }
          break;
      }
      console.log({ message });
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

  const disableButtons = operationStatus === "in flight";
  return (
    <div style={{ width: 900, height: 900, background: "yellow" }}>
      <Toolbar className="vuuPerfExamplesToolbar">
        <Button disabled={disableButtons} onClick={handleAddRows}>
          Add 1 Million rows
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
      </Toolbar>
      <div>Parent Orders: {parentOrderCount}</div>
      <div>Child Orders: {childOrderCount}</div>
      <br />
      <div>
        {operation} {operationStatus}
      </div>
    </div>
  );
};
TreePerformance.displaySequence = displaySequence++;
