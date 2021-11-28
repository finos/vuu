import { ServerProxy, TEST_setRequestId } from '../servers/vuu/new-server-proxy';
import {
  createTableRows,
  createTableGroupRows,
  createSubscription,
  updateTableRow
} from './test-utils';

const mockConnection = {
  send: jest.fn()
};

describe('ServerProxy', () => {
  describe('subscription', () => {
    it('creates Viewport on client subscribe', () => {
      const [clientSubscription] = createSubscription();
      const serverProxy = new ServerProxy(mockConnection);
      serverProxy.subscribe(clientSubscription);
      expect(serverProxy.viewports.size).toEqual(1);
      const { clientViewportId, status } = serverProxy.viewports.get('client-vp-1');
      expect(clientViewportId).toEqual('client-vp-1');
      expect(status).toEqual('');
    });

    it('initialises Viewport when server ACKS subscription', () => {
      const [clientSubscription, serverSubscription] = createSubscription();
      const serverProxy = new ServerProxy(mockConnection);
      serverProxy.subscribe(clientSubscription);
      serverProxy.handleMessageFromServer(serverSubscription);
      expect(serverProxy.viewports.size).toEqual(1);
      expect(serverProxy.mapClientToServerViewport.get('client-vp-1')).toEqual('server-vp-1');
      const { clientViewportId, serverViewportId, status } =
        serverProxy.viewports.get('server-vp-1');
      expect(clientViewportId).toEqual('client-vp-1');
      expect(serverViewportId).toEqual('server-vp-1');
      expect(status).toEqual('subscribed');
    });
  });

  describe('Data Handling', () => {
    const [clientSubscription1, serverSubscriptionAck1] = createSubscription();

    it('sends data to client when initial full dataset is received', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 100,
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true]
            ]
          }
        }
      });
    });

    it('only sends data to client once all data for client range is available', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 5)
          ]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 100
          }
        }
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: createTableRows('server-vp-1', 5, 10, 100, 2 /* ts */)
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true]
            ]
          }
        }
      });
    });
  });

  describe('Scrolling, no buffer', () => {
    const [clientSubscription1, serverSubscriptionAck1] = createSubscription();

    it('scrolls forward, partial viewport', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      callback.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 2, hi: 12 }
      });
      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: { type: 'CHANGE_VP_RANGE_SUCCESS', viewPortId: 'server-vp-1', from: 2, to: 12 }
      });

      expect(callback).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: createTableRows('server-vp-1', 10, 12)
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true],
              [10, 1, true, null, null, 1, 'key-10', 0, 'key-10', 'name 10', 1010, true],
              [11, 0, true, null, null, 1, 'key-11', 0, 'key-11', 'name 11', 1011, true]
            ]
          }
        }
      });
    });

    it('scrolls forward, discrete viewport', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      callback.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 20, hi: 30 }
      });
      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: { type: 'CHANGE_VP_RANGE_SUCCESS', viewPortId: 'server-vp-1', from: 20, to: 30 }
      });

      expect(callback).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: createTableRows('server-vp-1', 20, 30)
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [20, 9, true, null, null, 1, 'key-20', 0, 'key-20', 'name 20', 1020, true],
              [21, 8, true, null, null, 1, 'key-21', 0, 'key-21', 'name 21', 1021, true],
              [22, 7, true, null, null, 1, 'key-22', 0, 'key-22', 'name 22', 1022, true],
              [23, 6, true, null, null, 1, 'key-23', 0, 'key-23', 'name 23', 1023, true],
              [24, 5, true, null, null, 1, 'key-24', 0, 'key-24', 'name 24', 1024, true],
              [25, 4, true, null, null, 1, 'key-25', 0, 'key-25', 'name 25', 1025, true],
              [26, 3, true, null, null, 1, 'key-26', 0, 'key-26', 'name 26', 1026, true],
              [27, 2, true, null, null, 1, 'key-27', 0, 'key-27', 'name 27', 1027, true],
              [28, 1, true, null, null, 1, 'key-28', 0, 'key-28', 'name 28', 1028, true],
              [29, 0, true, null, null, 1, 'key-29', 0, 'key-29', 'name 29', 1029, true]
            ]
          }
        }
      });
    });
  });

  describe('Updates', () => {
    const [clientSubscription1, serverSubscriptionAck1] = createSubscription();

    it('Updates, no scrolling, only sends updated rows to client', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [updateTableRow('server-vp-1', 3, 2003)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [[3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 2003, true]]
          }
        }
      });
    });
  });

  describe('Buffering data', () => {
    it('buffers 10 rows, server sends entire buffer set', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 10 });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: 'client-vp-1',
        user: 'user',
        body: {
          type: 'CREATE_VP',
          table: 'test-table',
          range: { from: 0, to: 20 },
          sort: { sortDefs: [] },
          filterSpec: { filter: '' },
          groupBy: []
        },
        module: 'CORE'
      });

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 20)
          ]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true]
            ],
            size: 100
          }
        }
      });
    });

    it('buffers 10 rows, server sends partial buffer set, enough to fulfill client request, followed by rest', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 10 });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true]
            ],
            size: 100
          }
        }
      });

      callback.mockClear();

      // This will be a buffer top-up only, so no callback
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 10, 20)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('buffers 10 rows, server sends partial buffer set, not enough to fulfill client request, followed by rest', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 10 });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 9)
          ]
        }
      });

      // First call will be size only
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 100
          }
        }
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 9, 15, 100, 2)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true]
            ]
          }
        }
      });

      callback.mockClear();

      // This will be a buffer top-up only, so no callback
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 15, 20)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  describe('scrolling, with buffer', () => {
    it('scroll to end', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        hi: 20,
        bufferSize: 100
      });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 5000,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 120, 5000)
          ]
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 4975, hi: 5000 }
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        body: {
          viewPortId: 'server-vp-1',
          type: 'CHANGE_VP_RANGE',
          from: 4875,
          to: 5000
        },
        user: 'user',
        module: 'CORE'
      });

      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: { type: 'CHANGE_VP_RANGE_SUCCESS', viewPortId: 'server-vp-1', from: 4975, to: 5000 }
      });

      expect(callback).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: createTableRows('server-vp-1', 4975, 5000)
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [4975, 19, true, null, null, 1, 'key-75', 0, 'key-75', 'name 75', 5975, true],
              [4976, 18, true, null, null, 1, 'key-76', 0, 'key-76', 'name 76', 5976, true],
              [4977, 17, true, null, null, 1, 'key-77', 0, 'key-77', 'name 77', 5977, true],
              [4978, 16, true, null, null, 1, 'key-78', 0, 'key-78', 'name 78', 5978, true],
              [4979, 15, true, null, null, 1, 'key-79', 0, 'key-79', 'name 79', 5979, true],
              [4980, 14, true, null, null, 1, 'key-80', 0, 'key-80', 'name 80', 5980, true],
              [4981, 13, true, null, null, 1, 'key-81', 0, 'key-81', 'name 81', 5981, true],
              [4982, 12, true, null, null, 1, 'key-82', 0, 'key-82', 'name 82', 5982, true],
              [4983, 11, true, null, null, 1, 'key-83', 0, 'key-83', 'name 83', 5983, true],
              [4984, 10, true, null, null, 1, 'key-84', 0, 'key-84', 'name 84', 5984, true],
              [4985, 9, true, null, null, 1, 'key-85', 0, 'key-85', 'name 85', 5985, true],
              [4986, 8, true, null, null, 1, 'key-86', 0, 'key-86', 'name 86', 5986, true],
              [4987, 7, true, null, null, 1, 'key-87', 0, 'key-87', 'name 87', 5987, true],
              [4988, 6, true, null, null, 1, 'key-88', 0, 'key-88', 'name 88', 5988, true],
              [4989, 5, true, null, null, 1, 'key-89', 0, 'key-89', 'name 89', 5989, true],
              [4990, 4, true, null, null, 1, 'key-90', 0, 'key-90', 'name 90', 5990, true],
              [4991, 3, true, null, null, 1, 'key-91', 0, 'key-91', 'name 91', 5991, true],
              [4992, 2, true, null, null, 1, 'key-92', 0, 'key-92', 'name 92', 5992, true],
              [4993, 1, true, null, null, 1, 'key-93', 0, 'key-93', 'name 93', 5993, true],
              [4994, 0, true, null, null, 1, 'key-94', 0, 'key-94', 'name 94', 5994, true],
              [4995, 20, true, null, null, 1, 'key-95', 0, 'key-95', 'name 95', 5995, true],
              [4996, 21, true, null, null, 1, 'key-96', 0, 'key-96', 'name 96', 5996, true],
              [4997, 22, true, null, null, 1, 'key-97', 0, 'key-97', 'name 97', 5997, true],
              [4998, 23, true, null, null, 1, 'key-98', 0, 'key-98', 'name 98', 5998, true],
              [4999, 24, true, null, null, 1, 'key-99', 0, 'key-99', 'name 99', 5999, true]
            ],
            size: 100
          }
        }
      });
    });

    it('returns client range requests from buffer, if available. Calls server when end of buffer is approached', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 10 });
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 20)
          ]
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 2, hi: 12 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              // [2, 2, true, null, null, 1, "key-02", 0, "key-02", "name 02", 1002, true],
              // [3, 3, true, null, null, 1, "key-03", 0, "key-03", "name 03", 1003, true],
              // [4, 4, true, null, null, 1, "key-04", 0, "key-04", "name 04", 1004, true],
              // [5, 5, true, null, null, 1, "key-05", 0, "key-05", "name 05", 1005, true],
              // [6, 6, true, null, null, 1, "key-06", 0, "key-06", "name 06", 1006, true],
              // [7, 7, true, null, null, 1, "key-07", 0, "key-07", "name 07", 1007, true],
              // [8, 8, true, null, null, 1, "key-08", 0, "key-08", "name 08", 1008, true],
              // [9, 9, true, null, null, 1, "key-09", 0, "key-09", "name 09", 1009, true],
              [10, 1, true, null, null, 1, 'key-10', 0, 'key-10', 'name 10', 1010, true],
              [11, 0, true, null, null, 1, 'key-11', 0, 'key-11', 'name 11', 1011, true]
            ]
          }
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 5, hi: 15 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              // [5, 5, true, null, null, 1, "key-05", 0, "key-05", "name 05", 1005, true],
              // [6, 6, true, null, null, 1, "key-06", 0, "key-06", "name 06", 1006, true],
              // [7, 7, true, null, null, 1, "key-07", 0, "key-07", "name 07", 1007, true],
              // [8, 8, true, null, null, 1, "key-08", 0, "key-08", "name 08", 1008, true],
              // [9, 9, true, null, null, 1, "key-09", 0, "key-09", "name 09", 1009, true],
              // [10, 1, true, null, null, 1, "key-10", 0, "key-10", "name 10", 1010, true],
              // [11, 0, true, null, null, 1, "key-11", 0, "key-11", "name 11", 1011, true],
              [12, 4, true, null, null, 1, 'key-12', 0, 'key-12', 'name 12', 1012, true],
              [13, 3, true, null, null, 1, 'key-13', 0, 'key-13', 'name 13', 1013, true],
              [14, 2, true, null, null, 1, 'key-14', 0, 'key-14', 'name 14', 1014, true]
            ]
          }
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 8, hi: 18 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              // [8, 8, true, null, null, 1, "key-08", 0, "key-08", "name 08", 1008, true],
              // [9, 9, true, null, null, 1, "key-09", 0, "key-09", "name 09", 1009, true],
              // [10, 1, true, null, null, 1, "key-10", 0, "key-10", "name 10", 1010, true],
              // [11, 0, true, null, null, 1, "key-11", 0, "key-11", "name 11", 1011, true],
              // [12, 4, true, null, null, 1, "key-12", 0, "key-12", "name 12", 1012, true],
              // [13, 3, true, null, null, 1, "key-13", 0, "key-13", "name 13", 1013, true],
              // [14, 2, true, null, null, 1, "key-14", 0, "key-14", "name 14", 1014, true],
              [15, 7, true, null, null, 1, 'key-15', 0, 'key-15', 'name 15', 1015, true],
              [16, 6, true, null, null, 1, 'key-16', 0, 'key-16', 'name 16', 1016, true],
              [17, 5, true, null, null, 1, 'key-17', 0, 'key-17', 'name 17', 1017, true]
            ]
          }
        }
      });

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        user: 'user',
        body: { viewPortId: 'server-vp-1', type: 'CHANGE_VP_RANGE', from: 3, to: 23 },
        module: 'CORE'
      });
    });

    it('data is purged from holding pen if scrolled out of range, holding pen records sent to client when enough data available', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 10 });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      const viewport = serverProxy.viewports.get('server-vp-1');

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 5)
          ]
        }
      });

      // First call will be size only
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 100
          }
        }
      });

      expect(viewport.holdingPen).toHaveLength(5);

      callback.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 2, hi: 12 }
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(viewport.holdingPen).toHaveLength(3);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 5, 10, 100, 2)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(viewport.holdingPen).toHaveLength(8);

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 10, 15, 100, 3)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(viewport.holdingPen).toHaveLength(0);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true],
              [10, 1, true, null, null, 1, 'key-10', 0, 'key-10', 'name 10', 1010, true],
              [11, 0, true, null, null, 1, 'key-11', 0, 'key-11', 'name 11', 1011, true]
            ]
          }
        }
      });
    });

    it('data sequence is correct when scrolling backward and data from holding pen is used', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 10 });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      const viewport = serverProxy.viewports.get('server-vp-1');

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 20)
          ]
        }
      });

      callback.mockClear();

      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 20, hi: 30 }
      });
      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: { type: 'CHANGE_VP_RANGE_SUCCESS', viewPortId: 'server-vp-1', from: 15, to: 35 }
      });

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 15, 35, 100, 2)]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(viewport.holdingPen).toHaveLength(0);

      callback.mockClear();

      // now we scroll backward, beyond buffer, so we won't have all data, but we will have some
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 12, hi: 22 }
      });
      expect(callback).toHaveBeenCalledTimes(0);
      expect(viewport.holdingPen).toHaveLength(5);

      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: { type: 'CHANGE_VP_RANGE_SUCCESS', viewPortId: 'server-vp-1', from: 7, to: 27 }
      });

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 13, 15, 100, 3)]
        }
      });
      expect(callback).toHaveBeenCalledTimes(0);
      expect(viewport.holdingPen).toHaveLength(7);

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 7, 13, 100, 4)]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(viewport.holdingPen).toHaveLength(0);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [12, 0, true, null, null, 1, 'key-12', 0, 'key-12', 'name 12', 1012, true],
              [13, 1, true, null, null, 1, 'key-13', 0, 'key-13', 'name 13', 1013, true],
              [14, 2, true, null, null, 1, 'key-14', 0, 'key-14', 'name 14', 1014, true],
              [15, 3, true, null, null, 1, 'key-15', 0, 'key-15', 'name 15', 1015, true],
              [16, 4, true, null, null, 1, 'key-16', 0, 'key-16', 'name 16', 1016, true],
              [17, 5, true, null, null, 1, 'key-17', 0, 'key-17', 'name 17', 1017, true],
              [18, 6, true, null, null, 1, 'key-18', 0, 'key-18', 'name 18', 1018, true],
              [19, 7, true, null, null, 1, 'key-19', 0, 'key-19', 'name 19', 1019, true]
            ]
          }
        }
      });
    });

    it('Scrolling with large buffer. Keys are recomputed on each scroll. Calls server when end of buffer is approached', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 100 });

      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 1000,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 110, 1000)
          ]
        }
      });

      expect(serverProxy.viewports.get('server-vp-1').dataWindow.internalData).toHaveLength(110);
      expect(serverProxy.viewports.get('server-vp-1').dataWindow.clientRange).toEqual({
        from: 0,
        to: 10
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 12, hi: 23 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [12, 9, true, null, null, 1, 'key-12', 0, 'key-12', 'name 12', 1012, true],
              [13, 8, true, null, null, 1, 'key-13', 0, 'key-13', 'name 13', 1013, true],
              [14, 7, true, null, null, 1, 'key-14', 0, 'key-14', 'name 14', 1014, true],
              [15, 6, true, null, null, 1, 'key-15', 0, 'key-15', 'name 15', 1015, true],
              [16, 5, true, null, null, 1, 'key-16', 0, 'key-16', 'name 16', 1016, true],
              [17, 4, true, null, null, 1, 'key-17', 0, 'key-17', 'name 17', 1017, true],
              [18, 3, true, null, null, 1, 'key-18', 0, 'key-18', 'name 18', 1018, true],
              [19, 2, true, null, null, 1, 'key-19', 0, 'key-19', 'name 19', 1019, true],
              [20, 1, true, null, null, 1, 'key-20', 0, 'key-20', 'name 20', 1020, true],
              [21, 0, true, null, null, 1, 'key-21', 0, 'key-21', 'name 21', 1021, true],
              [22, 10, true, null, null, 1, 'key-22', 0, 'key-22', 'name 22', 1022, true]
            ]
          }
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 30, hi: 40 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [30, 0, true, null, null, 1, 'key-30', 0, 'key-30', 'name 30', 1030, true],
              [31, 1, true, null, null, 1, 'key-31', 0, 'key-31', 'name 31', 1031, true],
              [32, 2, true, null, null, 1, 'key-32', 0, 'key-32', 'name 32', 1032, true],
              [33, 3, true, null, null, 1, 'key-33', 0, 'key-33', 'name 33', 1033, true],
              [34, 4, true, null, null, 1, 'key-34', 0, 'key-34', 'name 34', 1034, true],
              [35, 5, true, null, null, 1, 'key-35', 0, 'key-35', 'name 35', 1035, true],
              [36, 6, true, null, null, 1, 'key-36', 0, 'key-36', 'name 36', 1036, true],
              [37, 7, true, null, null, 1, 'key-37', 0, 'key-37', 'name 37', 1037, true],
              [38, 8, true, null, null, 1, 'key-38', 0, 'key-38', 'name 38', 1038, true],
              [39, 9, true, null, null, 1, 'key-39', 0, 'key-39', 'name 39', 1039, true]
            ]
          }
        }
      });

      // callback.mockClear();
      // mockConnection.send.mockClear()

      // serverProxy.handleMessageFromClient({ viewport: "client-vp-1", type: "setViewRange", range: { lo: 5, hi: 15 } });

      // expect(mockConnection.send).toHaveBeenCalledTimes(0);
      // expect(callback).toHaveBeenCalledTimes(1)

      // expect(callback).toHaveBeenCalledWith({
      //   type: "viewport-updates", viewports: {
      //     "client-vp-1": {
      //       rows: [
      //         [5, 5, true, null, null, 1, "key-05", 0, "key-05", "name 05", 1005, true],
      //         [6, 6, true, null, null, 1, "key-06", 0, "key-06", "name 06", 1006, true],
      //         [7, 7, true, null, null, 1, "key-07", 0, "key-07", "name 07", 1007, true],
      //         [8, 8, true, null, null, 1, "key-08", 0, "key-08", "name 08", 1008, true],
      //         [9, 9, true, null, null, 1, "key-09", 0, "key-09", "name 09", 1009, true],
      //         [10, 1, true, null, null, 1, "key-10", 0, "key-10", "name 10", 1010, true],
      //         [11, 0, true, null, null, 1, "key-11", 0, "key-11", "name 11", 1011, true],
      //         [12, 4, true, null, null, 1, "key-12", 0, "key-12", "name 12", 1012, true],
      //         [13, 3, true, null, null, 1, "key-13", 0, "key-13", "name 13", 1013, true],
      //         [14, 2, true, null, null, 1, "key-14", 0, "key-14", "name 14", 1014, true],
      //       ],
      //     }
      //   }
      // });

      // callback.mockClear();
      // mockConnection.send.mockClear()
      // TEST_setRequestId(1);

      // serverProxy.handleMessageFromClient({ viewport: "client-vp-1", type: "setViewRange", range: { lo: 8, hi: 18 } });

      // expect(mockConnection.send).toHaveBeenCalledTimes(1);
      // expect(callback).toHaveBeenCalledTimes(1)

      // expect(callback).toHaveBeenCalledWith({
      //   type: "viewport-updates", viewports: {
      //     "client-vp-1": {
      //       rows: [
      //         [8, 8, true, null, null, 1, "key-08", 0, "key-08", "name 08", 1008, true],
      //         [9, 9, true, null, null, 1, "key-09", 0, "key-09", "name 09", 1009, true],
      //         [10, 1, true, null, null, 1, "key-10", 0, "key-10", "name 10", 1010, true],
      //         [11, 0, true, null, null, 1, "key-11", 0, "key-11", "name 11", 1011, true],
      //         [12, 4, true, null, null, 1, "key-12", 0, "key-12", "name 12", 1012, true],
      //         [13, 3, true, null, null, 1, "key-13", 0, "key-13", "name 13", 1013, true],
      //         [14, 2, true, null, null, 1, "key-14", 0, "key-14", "name 14", 1014, true],
      //         [15, 7, true, null, null, 1, "key-15", 0, "key-15", "name 15", 1015, true],
      //         [16, 6, true, null, null, 1, "key-16", 0, "key-16", "name 16", 1016, true],
      //         [17, 5, true, null, null, 1, "key-17", 0, "key-17", "name 17", 1017, true],
      //       ],
      //     }
      //   }
      // });

      // expect(mockConnection.send).toHaveBeenCalledWith({
      //   requestId: '1',
      //   user: "user",
      //   body: { viewPortId: "server-vp-1", type: "CHANGE_VP_RANGE", from: 3, to: 23 },
      //   module: "CORE"
      // })
    });
  });

  describe('synchronising with server', () => {
    it('does not spam server when buffer limit reached', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 20 });
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);

      TEST_setRequestId(1);

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 30)
          ]
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 16, hi: 26 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        user: 'user',
        body: { viewPortId: 'server-vp-1', type: 'CHANGE_VP_RANGE', from: 6, to: 36 },
        module: 'CORE'
      });

      callback.mockClear();
      mockConnection.send.mockClear();
      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 17, hi: 27 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 18, hi: 28 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('re-requests data from server even before receiving results', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({ bufferSize: 20 });
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);

      TEST_setRequestId(1);

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 30)
          ]
        }
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 16, hi: 26 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        user: 'user',
        body: { viewPortId: 'server-vp-1', type: 'CHANGE_VP_RANGE', from: 6, to: 36 },
        module: 'CORE'
      });

      callback.mockClear();
      mockConnection.send.mockClear();
      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 17, hi: 27 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      mockConnection.send.mockClear();

      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'setViewRange',
        range: { lo: 24, hi: 34 }
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(0);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        user: 'user',
        body: { viewPortId: 'server-vp-1', type: 'CHANGE_VP_RANGE', from: 14, to: 44 },
        module: 'CORE'
      });
    });
  });

  describe('growing and shrinking rowset (Orders)', () => {
    it('initializes with rowset that does not fill client viewport', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        hi: 20,
        bufferSize: 100
      });
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 10,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10, 10)
          ]
        }
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 10,
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true],
              [6, 6, true, null, null, 1, 'key-06', 0, 'key-06', 'name 06', 1006, true],
              [7, 7, true, null, null, 1, 'key-07', 0, 'key-07', 'name 07', 1007, true],
              [8, 8, true, null, null, 1, 'key-08', 0, 'key-08', 'name 08', 1008, true],
              [9, 9, true, null, null, 1, 'key-09', 0, 'key-09', 'name 09', 1009, true]
            ]
          }
        }
      });
    });

    it('gradually reduces, then grows viewport', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        hi: 20,
        bufferSize: 100
      });
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 10,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE'
            },
            ...createTableRows('server-vp-1', 0, 10, 10)
          ]
        }
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 9,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            }
          ]
        }
      });

      // callbacks will be size only
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: { 'client-vp-1': { size: 9 } }
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 8,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            }
          ]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: { 'client-vp-1': { size: 8 } }
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 1,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            }
          ]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: { 'client-vp-1': { size: 1 } }
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 0,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            }
          ]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: { 'client-vp-1': { size: 0 } }
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 1,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 1, 1)
          ]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 1,
            rows: [[0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true]]
          }
        }
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 2,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 1, 2, 2)
          ]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 2,
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true]
            ]
          }
        }
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 6,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 2, 6, 6)
          ]
        }
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            size: 6,
            rows: [
              [0, 0, true, null, null, 1, 'key-00', 0, 'key-00', 'name 00', 1000, true],
              [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true],
              [2, 2, true, null, null, 1, 'key-02', 0, 'key-02', 'name 02', 1002, true],
              [3, 3, true, null, null, 1, 'key-03', 0, 'key-03', 'name 03', 1003, true],
              [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true],
              [5, 5, true, null, null, 1, 'key-05', 0, 'key-05', 'name 05', 1005, true]
            ]
          }
        }
      });
    });
  });

  describe('selection', () => {
    it('single select', () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        hi: 20,
        bufferSize: 100
      });
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 10,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10, 10)
          ]
        }
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'select',
        rangeSelect: false,
        keepExistingSelection: false,
        row: [1, 1, true, null, null, 1, 'key-01', 0, 'key-01', 'name 01', 1001, true]
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        body: {
          vpId: 'server-vp-1',
          type: 'SET_SELECTION',
          selection: [1]
        },
        user: 'user',
        module: 'CORE'
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'select',
        rangeSelect: false,
        keepExistingSelection: false,
        row: [4, 4, true, null, null, 1, 'key-04', 0, 'key-04', 'name 04', 1004, true]
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        body: {
          vpId: 'server-vp-1',
          type: 'SET_SELECTION',
          selection: [4]
        },
        user: 'user',
        module: 'CORE'
      });
    });
  });

  describe('GroupBy', () => {
    const [clientSubscription1, serverSubscriptionAck1] = createSubscription();

    it('sets viewport isTree when groupby in place', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'groupBy',
        groupBy: ['col-4']
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        requestId: '1',
        body: {
          viewPortId: 'server-vp-1',
          type: 'CHANGE_VP',
          columns: ['col-1', 'col-2', 'col-3', 'col-4'],
          sort: { sortDefs: [] },
          filterSpec: { filter: '' },
          groupBy: ['col-4']
        },
        user: 'user',
        module: 'CORE'
      });

      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: {
          type: 'CHANGE_VP_SUCCESS',
          viewPortId: 'server-vp-1',
          columns: ['col-1', 'col-2', 'col-3', 'col-4'],
          sort: { sortDefs: [] },
          filterSpec: { filter: '' },
          groupBy: ['col-4']
        }
      });

      expect(serverProxy.viewports.get('server-vp-1').isTree).toBe(true);
    });

    it('ignores regular row updates after grouping is in place', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'groupBy',
        groupBy: ['col-4']
      });

      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: {
          type: 'CHANGE_VP_SUCCESS',
          viewPortId: 'server-vp-1',
          columns: ['col-1', 'col-2', 'col-3', 'col-4'],
          sort: { sortDefs: [] },
          filterSpec: { filter: '' },
          groupBy: ['col-4']
        }
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [...createTableRows('server-vp-1', 0, 10)]
        }
      });

      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('processes group row updates', () => {
      const callback = jest.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        body: {
          type: 'TABLE_ROW',
          rows: [
            {
              viewPortId: 'server-vp-1',
              vpSize: 100,
              rowIndex: -1,
              rowKey: 'SIZE',
              updateType: 'SIZE',
              ts: 1
            },
            ...createTableRows('server-vp-1', 0, 10)
          ]
        }
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: 'client-vp-1',
        type: 'groupBy',
        groupBy: ['col-4']
      });

      serverProxy.handleMessageFromServer({
        requestId: '1',
        body: {
          type: 'CHANGE_VP_SUCCESS',
          viewPortId: 'server-vp-1',
          columns: ['col-1', 'col-2', 'col-3', 'col-4'],
          sort: { sortDefs: [] },
          filterSpec: { filter: '' },
          groupBy: ['col-4']
        }
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer(createTableGroupRows());

      expect(callback).toHaveBeenCalledTimes(1);
      expect(serverProxy.viewports.get('server-vp-1').dataWindow.internalData).toHaveLength(4);
      expect(callback).toHaveBeenCalledWith({
        type: 'viewport-updates',
        viewports: {
          'client-vp-1': {
            rows: [
              [0, 0, false, false, 1, 43714, '$root/USD', 0, '', 'USD', '', '', '', '', ''],
              [1, 1, false, false, 1, 43941, '$root/EUR', 0, '', 'EUR', '', '', '', '', ''],
              [2, 2, false, false, 1, 43997, '$root/GBX', 0, '', 'GBX', '', '', '', '', ''],
              [3, 3, false, false, 1, 44108, '$root/CAD', 0, '', 'CAD', '', '', '', '', '']
            ],
            size: 4
          }
        }
      });
    });
  });
});
