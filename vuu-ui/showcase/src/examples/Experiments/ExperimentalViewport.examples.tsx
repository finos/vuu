import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import {
  IClient,
  MockClient,
} from "@vuu-ui/vuu-data-remote/next/test/MockClient";
import { VuuWebSocket } from "@vuu-ui/vuu-data-remote/next/test/VuuWebSocket";
import { VuuSortCol, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ChangeEvent, useCallback, useRef, useState } from "react";

const VUU_WS_URL = "ws://localhost:8091/websocket";
const ORDER_ADMIN_URL = "http://localhost:8093/admin";

const OrdersPanel = () => {
  const [newOrders, setNewOrders] = useState("5");
  const clientRef = useRef<IClient>(undefined);

  const webSocketLoad = useCallback(async (bufferSize = 0, table: VuuTable) => {
    clientRef.current = await MockClient({
      bufferSize,
      dataSourceProps: {
        table,
        columns: ["id", "side", "status", "ric", "created", "lastUpdate"],
      },
      WebSocketProps: {
        WebSocketClass: VuuWebSocket,
        url: VUU_WS_URL,
      },
    });
    clientRef.current.subscribe();
  }, []);

  const sort = useCallback((sortDefs: VuuSortCol[]) => {
    clientRef.current?.sort({ sortDefs });
  }, []);

  const start = useCallback(() => {
    const newOrdersPerSecond = isNaN(parseInt(newOrders))
      ? 2
      : parseInt(newOrders);

    fetch(`${ORDER_ADMIN_URL}/start?newOrdersPerSecond=${newOrdersPerSecond}`);
  }, [newOrders]);
  const stop = useCallback(() => {
    console.log("start");
    fetch(`${ORDER_ADMIN_URL}/stop`);
  }, []);

  return (
    <div
      className="OrdersAdmin"
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: 10 }}
    >
      <div>Orders</div>
      <div className="OrdersPanel">
        <FormField style={{ width: 200 }}>
          <FormFieldLabel>New Orders per second</FormFieldLabel>
          <Input
            value={newOrders}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setNewOrders(event.target.value);
            }}
          />
        </FormField>
      </div>
      <div>
        <Button
          onClick={() =>
            webSocketLoad(0, { module: "ORDERS", table: "parentOrders" })
          }
        >
          Subscribe, no buffer
        </Button>
        <Button onClick={() => sort([{ column: "created", sortType: "D" }])}>
          Sort created, desc
        </Button>
      </div>
      <div>
        <Button onClick={start}>Start</Button>
        <Button onClick={stop}>Stop</Button>
      </div>
    </div>
  );
};

export const SimpleLoad = () => {
  return (
    <>
      <div
        style={{
          alignItems: "flex-start",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      ></div>

      <OrdersPanel />
    </>
  );
};
