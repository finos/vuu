import { vi } from "vitest";
import {
  VuuViewportCreateSuccessResponse,
  ServerToClientTableRows,
  VuuRow,
  VuuServerMessage,
  VuuTableMetaResponse,
  VuuDataRow,
} from "@vuu-ui/vuu-protocol-types";
import {
  ServerProxy,
  TEST_setRequestId,
} from "../src/server-proxy/server-proxy";

import { PostMessageToClientCallback } from "../src";
import {
  DataSourceConstructorProps,
  ServerProxySubscribeMessage,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { WebSocketConnection } from "../src/WebSocketConnection";

export const COMMON_ATTRS = {
  module: "TEST",
  requestId: "",
  token: "",
  user: "",
};

export const COMMON_TABLE_ROW_ATTRS = {
  batch: "",
  isLast: true,
  timeStamp: 1,
  type: "TABLE_ROW" as const,
};

export const COMMON_ROW_ATTRS = {
  sel: 0 as const,
  ts: 1,
  vpVersion: "",
};

export const sizeRow = (viewPortId = "server-vp-1", vpSize = 100) =>
  ({
    ...COMMON_ROW_ATTRS,
    data: [],
    viewPortId,
    vpSize,
    rowIndex: -1,
    rowKey: "SIZE",
    updateType: "SIZE",
  }) as VuuRow;

export const TABLE_ROW = (rows: VuuRow<VuuDataRow>[]): VuuServerMessage => ({
  ...COMMON_ATTRS,
  body: {
    ...COMMON_TABLE_ROW_ATTRS,
    rows,
  },
});

/**
 *
 * @param viewPortId string
 * @param from
 * @param to
 * @param vpSize
 * @param ts timestamp
 * @param sel
 * @param numericValue
 * @returns
 */
export const createTableRows = (
  viewPortId: string,
  from: number,
  to: number,
  vpSize = 100,
  ts = 1,
  sel: 0 | 1 = 0,
  numericValue = 1000,
): VuuRow[] => {
  const results: VuuRow[] = [];
  for (let rowIndex = from; rowIndex < to; rowIndex++) {
    const key = ("0" + rowIndex).slice(-2);
    const rowKey = `key-${key}`;
    results.push({
      data: [rowKey, `name ${key}`, numericValue + rowIndex, true],
      rowIndex,
      rowKey,
      updateType: "U",
      sel,
      ts,
      viewPortId,
      vpSize,
      vpVersion: "",
    });
  }
  return results;
};

export const createTableGroupRows = (
  includeSizeRow = true,
): VuuServerMessage<ServerToClientTableRows> => {
  // prettier-ignore
  const message: VuuServerMessage<ServerToClientTableRows> =  {
    ...COMMON_ATTRS,
    requestId: '1',
    body: {
      ...COMMON_TABLE_ROW_ATTRS,
      rows: []
    }
  };

  if (includeSizeRow) {
    message.body.rows.push({
      ...COMMON_ROW_ATTRS,
      viewPortId: "server-vp-1",
      vpSize: 4,
      rowIndex: -1,
      rowKey: "SIZE",
      updateType: "SIZE",
      data: [],
    });
  }

  // prettier-ignore
  message.body.rows.push(        
  {
    ...COMMON_ROW_ATTRS,
    viewPortId: 'server-vp-1',
    vpSize: 4,
    rowIndex: 0,
    rowKey: '$root|USD',
    updateType: 'U',
    data: [1, false, '$root|USD', false, 'USD', 43714, '', 'USD', '', '', '', '', '']
  },
  {
    ...COMMON_ROW_ATTRS,
    viewPortId: 'server-vp-1',
    vpSize: 4,
    rowIndex: 1,
    rowKey: '$root|EUR',
    updateType: 'U',
    data: [1, false, '$root|EUR', false, 'EUR', 43941, '', 'EUR', '', '', '', '', '']
  },
  {
    ...COMMON_ROW_ATTRS,
    viewPortId: 'server-vp-1',
    vpSize: 4,
    rowIndex: 2,
    rowKey: '$root|GBX',
    updateType: 'U',
    data: [1, false, '$root|GBX', false, 'GBX', 43997, '', 'GBX', '', '', '', '', '']
  },
  {
    ...COMMON_ROW_ATTRS,
    viewPortId: 'server-vp-1',
    vpSize: 4,
    rowIndex: 3,
    rowKey: '$root|CAD',
    updateType: 'U',
    data: [1, false, '$root|CAD', false, 'CAD', 44108, '', 'CAD', '', '', '', '', '']
  }
);

  return message;
};

export const updateTableRow = (
  viewPortId: string,
  rowIndex: number,
  updatedVal: string | number | boolean,
  { key = "", vpSize = 100, ts = 2 } = {},
): VuuRow => {
  const keyVal = key || ("0" + rowIndex).slice(-2);
  const rowKey = `key-${keyVal}`;
  return {
    ...COMMON_ROW_ATTRS,
    viewPortId,
    vpSize,
    rowIndex,
    rowKey,
    ts,
    updateType: "U",
    data: [rowKey, `name ${keyVal}`, updatedVal, true],
  };
};

export const testSchema: TableSchema = {
  columns: [
    { name: "col-1", serverDataType: "string" },
    { name: "col-2", serverDataType: "string" },
    { name: "col-3", serverDataType: "string" },
    { name: "col-4", serverDataType: "string" },
  ],
  key: "col-1",
  table: { module: "TEST", table: "test-table" },
};

interface CreateSubscriptionProps
  extends Pick<
    DataSourceConstructorProps,
    | "aggregations"
    | "bufferSize"
    | "columns"
    | "filterSpec"
    | "groupBy"
    | "sort"
    | "viewport"
  > {
  from?: number;
  key?: string;
  to?: number;
}

// prettier-ignore
export const createSubscription = ({
  aggregations = [],
  bufferSize = 0,
  columns = ["col-1"],
  filterSpec = { filter: ''},
  from = 0,
  groupBy = [],
  key = '1',
  to = 10,
  sort = {sortDefs: []},
  viewport = `client-vp-${key}`
}: CreateSubscriptionProps = {}): [
  ServerProxySubscribeMessage, 
  VuuServerMessage<VuuViewportCreateSuccessResponse>,
  VuuServerMessage<VuuTableMetaResponse>
] => [
  { 
    aggregations,
    bufferSize, 
    columns, 
    filterSpec, 
    groupBy, 
    range: { from, to }, 
    sort, 
    table: {module: "TEST", table: 'test-table'}, 
    viewport 
  },
  {
    module: "TEST",
    requestId: `client-vp-${key}`,
    body: {
      aggregations: [],
      columns: ['col-1', 'col-2', 'col-3', 'col-4'],
      filterSpec,
      groupBy,
      range: { from, to: to + bufferSize },
      sort,
      table: "test-table",
      type: 'CREATE_VP_SUCCESS',
      viewPortId: `server-vp-${key}`,
    },
  }, {
    module: "TEST",
    requestId: `1`,
    body: {
      columns: ['col-1', 'col-2', 'col-3', 'col-4'],
      key: 'col-1',
      dataTypes: ['string','string','string','string'],
      table: {module: "TEST", table: "test-table"},
      type: "TABLE_META_RESP"
    },

  }
];

export const subscribe = async (
  serverProxy: ServerProxy,
  { bufferSize = 0, key = "1", to = 10 }: SubscriptionDetails,
) => {
  const [clientSubscription, serverSubscriptionAck, tableMetaResponse] =
    createSubscription({ bufferSize, key, to });
  return new Promise((resolve) => {
    serverProxy.subscribe(clientSubscription).then(resolve);
    serverProxy.handleMessageFromServer(serverSubscriptionAck);
    serverProxy.handleMessageFromServer(tableMetaResponse);
  });
};

export type SubscriptionDetails = {
  bufferSize?: number;
  key?: string;
  to?: number;
};

export type Mock = { mockClear: () => void };
export type MockedConnection = Omit<
  WebSocketConnection,
  "on" | "protocols" | "send"
> & {
  on: WebSocketConnection["on"] & Mock;
  send: WebSocketConnection["send"] & Mock;
};

export const createConnection = () => {
  return {
    connectionTimeout: 0,
    on: vi.fn(),
    requiresLogin: true,
    send: vi.fn(),
    status: "ready" as const,
  };
};

export const createFixtures = async (
  proxyParams: {
    bufferSize?: number;
    connection?: MockedConnection;
    key?: string;
    to?: number;
  } = {},
): Promise<
  [ServerProxy, PostMessageToClientCallback & Mock, MockedConnection]
> => {
  TEST_setRequestId(1);
  const postMessageToClient = vi.fn();
  const connection = createConnection();
  const serverProxy = await createServerProxyAndSubscribeToViewport(
    postMessageToClient,
    {
      ...proxyParams,
      connection,
    },
  );

  return [serverProxy, postMessageToClient, connection];
};

export const createServerProxyAndSubscribeToViewport = async (
  postMessageToClient: any,
  {
    bufferSize = 0,
    connection = createConnection(),
    key = "1",
    to = 10,
  }: { bufferSize?: number; connection?: any; key?: string; to?: number } = {},
) => {
  const serverProxy = new ServerProxy(connection, postMessageToClient);
  //TODO we shouldn't be able to bypass checks like this
  serverProxy["sessionId"] = "dsdsd";
  serverProxy["authToken"] = "test";

  await subscribe(serverProxy, { bufferSize, key, to });

  return serverProxy;
};

class ServerAPI {
  #serverProxy: ServerProxy;
  constructor(serverProxy: ServerProxy) {
    this.#serverProxy = serverProxy;
  }
  ackRangeRequest(
    from: number,
    to: number,
    requestId = "1",
    viewPortId = "server-vp-1",
  ) {
    this.#serverProxy.handleMessageFromServer({
      ...COMMON_ATTRS,
      requestId,
      body: {
        type: "CHANGE_VP_RANGE_SUCCESS",
        viewPortId,
        from,
        to,
      },
    });
  }

  receiveWebsocketData(rows: VuuRow[]) {
    this.#serverProxy.handleMessageFromServer({
      ...COMMON_ATTRS,
      body: {
        ...COMMON_TABLE_ROW_ATTRS,
        rows,
      },
    });
  }
}
export const serverAPI = (serverProxy: ServerProxy) =>
  new ServerAPI(serverProxy);
