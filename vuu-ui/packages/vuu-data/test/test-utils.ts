import { vi } from "vitest";
import {
  ServerToClientCreateViewPortSuccess,
  ServerToClientMessage,
  ServerToClientTableRows,
  VuuRow,
} from "@finos/vuu-protocol-types";
import { ServerProxy } from "../src/server-proxy/server-proxy";

import { ServerProxySubscribeMessage } from "../src";

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
  } as VuuRow);

export const createTableRows = (
  viewPortId,
  from,
  to,
  vpSize = 100,
  ts = 1,
  sel: 0 | 1 = 0
) => {
  const results: VuuRow[] = [];
  for (let rowIndex = from; rowIndex < to; rowIndex++) {
    const key = ("0" + rowIndex).slice(-2);
    const rowKey = `key-${key}`;
    results.push({
      data: [rowKey, `name ${key}`, 1000 + rowIndex, true],
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

export const createTableGroupRows =
  (): ServerToClientMessage<ServerToClientTableRows> => {
    // prettier-ignore
    return {
    ...COMMON_ATTRS,
    requestId: '1',
    body: {
      ...COMMON_TABLE_ROW_ATTRS,
      rows: [
        {
          ...COMMON_ROW_ATTRS,
          viewPortId: 'server-vp-1',
          vpSize: 4,
          rowIndex: -1,
          rowKey: 'SIZE',
          updateType: 'SIZE',
          data: []
        },
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
      ]
    }
  };
  };

export const updateTableRow = (
  viewPortId,
  rowIndex,
  updatedVal,
  { vpSize = 100, ts = 2 } = {}
): VuuRow => {
  const key = ("0" + rowIndex).slice(-2);
  const rowKey = `key-${key}`;
  return {
    ...COMMON_ROW_ATTRS,
    viewPortId,
    vpSize,
    rowIndex,
    rowKey,
    ts,
    updateType: "U",
    data: [rowKey, `name ${key}`, updatedVal, true],
  };
};

// prettier-ignore
export const createSubscription = ({
  aggregations = [],
  columns = ["col-1"],
  bufferSize = 0,
  filter = { filter: ''},
  from = 0,
  groupBy = [],
  key = '1',
  to = 10,
  sort = {sortDefs: []},
  viewport = `client-vp-${key}`
} = {}): [
  ServerProxySubscribeMessage, 
  ServerToClientMessage<ServerToClientCreateViewPortSuccess>
] => [
  { 
    aggregations,
    bufferSize, 
    columns, 
    filter, 
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
      filterSpec: filter,
      groupBy,
      range: { from, to: to + bufferSize },
      sort,
      table: "test-table",
      type: 'CREATE_VP_SUCCESS',
      viewPortId: `server-vp-${key}`,
    },
    token: "",
    user: "user"
  }
];

const mockConnection = {
  send: vi.fn(),
  status: "ready" as const,
};

export const createServerProxyAndSubscribeToViewport = (
  postMessageToClient: any,
  {
    bufferSize = 0,
    connection = mockConnection,
  }: { bufferSize?: number; connection?: any } = {}
) => {
  const serverProxy = new ServerProxy(connection, postMessageToClient);
  //TODO we shouldn't be able to bypass checks like this
  serverProxy["sessionId"] = "dsdsd";
  serverProxy["authToken"] = "test";

  const [clientSubscription, serverSubscriptionAck] = createSubscription({
    bufferSize,
  });

  serverProxy.subscribe(clientSubscription);
  serverProxy.handleMessageFromServer(serverSubscriptionAck);

  postMessageToClient.mockClear();

  return serverProxy;
};
