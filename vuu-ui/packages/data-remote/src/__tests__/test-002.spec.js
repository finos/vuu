import { ServerProxy, TEST_setRequestId } from '../server-proxy/server-proxy';
import { createSubscription } from './test-utils';

const mockConnection = {
  send: jest.fn()
};
const callback = (message) => {
  const rows = message.viewports['YqeQzZ9DHu9q5HctdEJJw'].rows;
  console.table(rows);
};

describe('server-proxy-generated-test', () => {
  test('test with captures messages', () => {
    const [clientSubscription] = createSubscription({
      viewport: 'YqeQzZ9DHu9q5HctdEJJw',
      lo: 0,
      hi: 42,
      bufferSize: 100
    });
    const serverProxy = new ServerProxy(mockConnection, callback);
    serverProxy.subscribe(clientSubscription);

    serverProxy.handleMessageFromServer({
      requestId: 'YqeQzZ9DHu9q5HctdEJJw',
      sessionId: 'b2b366c2-fc69-4d7d-a281-86d7f298b340',
      token: '7b541bfc-0617-4836-9038-227a84d64ab1',
      user: 'user',
      body: {
        type: 'CREATE_VP_SUCCESS',
        viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
        table: 'instruments',
        range: { from: 0, to: 142 },
        columns: ['bbg', 'currency', 'description', 'exchange', 'isin', 'lotSize', 'ric'],
        sort: { sortDefs: [] },
        groupBy: [],
        filterSpec: {
          filter: ''
        }
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: 'b2b366c2-fc69-4d7d-a281-86d7f298b340',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '7a1c4e45-2315-4a2a-9881-5d040de81f2f',
        isLast: true,
        timeStamp: 1618002389766,
        rows: [
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: -1,
            rowKey: 'SIZE',
            updateType: 'SIZE',
            ts: 1618002389766,
            sel: 0,
            data: []
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 0,
            rowKey: 'AAA.L',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA LN', 'USD', 'AAA.L London PLC', 'XLON/LSE-SETS', '', 633, 'AAA.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 1,
            rowKey: 'AAA.N',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA US', 'EUR', 'AAA.N Corporation', 'XNGS/NAS-GSM', '', 220, 'AAA.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 2,
            rowKey: 'AAA.OQ',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA OQ', 'EUR', 'AAA.OQ Co.', 'XNYS/NYS-MAIN', '', 393, 'AAA.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 3,
            rowKey: 'AAA.AS',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA NL', 'GBX', 'AAA.AS B.V', 'XAMS/ENA-MAIN', '', 449, 'AAA.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 4,
            rowKey: 'AAA.OE',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA OE', 'GBX', 'AAA.OE Co.', 'XNYS/NYS-MAIN', '', 37, 'AAA.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 5,
            rowKey: 'AAA.MI',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA MI', 'CAD', 'AAA.MI Co.', 'XNYS/NYS-MAIN', '', 38, 'AAA.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 6,
            rowKey: 'AAA.A',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA A', 'GBX', 'AAA.A Co.', 'XNYS/NYS-MAIN', '', 286, 'AAA.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 7,
            rowKey: 'AAA.PA',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA PA', 'USD', 'AAA.PA Co.', 'XNYS/NYS-MAIN', '', 364, 'AAA.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 8,
            rowKey: 'AAA.MC',
            updateType: 'U',
            ts: 1618002389766,
            sel: 0,
            data: ['AAA MC', 'EUR', 'AAA.MC Co.', 'XNYS/NYS-MAIN', '', 12, 'AAA.MC']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: 'b2b366c2-fc69-4d7d-a281-86d7f298b340',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '540bb617-cb1e-4f93-b358-bc2da3fcc2f5',
        isLast: true,
        timeStamp: 1618002389772,
        rows: [
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 9,
            rowKey: 'AAA.DE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAA DE', 'CAD', 'AAA.DE Co.', 'XNYS/NYS-MAIN', '', 927, 'AAA.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 10,
            rowKey: 'AAB.L',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB LN', 'GBX', 'AAB.L London PLC', 'XLON/LSE-SETS', '', 559, 'AAB.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 11,
            rowKey: 'AAB.N',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB US', 'CAD', 'AAB.N Corporation', 'XNGS/NAS-GSM', '', 946, 'AAB.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 12,
            rowKey: 'AAB.OQ',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB OQ', 'CAD', 'AAB.OQ Co.', 'XNYS/NYS-MAIN', '', 363, 'AAB.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 13,
            rowKey: 'AAB.AS',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB NL', 'CAD', 'AAB.AS B.V', 'XAMS/ENA-MAIN', '', 696, 'AAB.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 14,
            rowKey: 'AAB.OE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB OE', 'EUR', 'AAB.OE Co.', 'XNYS/NYS-MAIN', '', 806, 'AAB.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 15,
            rowKey: 'AAB.MI',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB MI', 'GBX', 'AAB.MI Co.', 'XNYS/NYS-MAIN', '', 44, 'AAB.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 16,
            rowKey: 'AAB.A',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB A', 'GBX', 'AAB.A Co.', 'XNYS/NYS-MAIN', '', 226, 'AAB.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 17,
            rowKey: 'AAB.PA',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB PA', 'GBX', 'AAB.PA Co.', 'XNYS/NYS-MAIN', '', 54, 'AAB.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 18,
            rowKey: 'AAB.MC',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB MC', 'USD', 'AAB.MC Co.', 'XNYS/NYS-MAIN', '', 618, 'AAB.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 19,
            rowKey: 'AAB.DE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAB DE', 'CAD', 'AAB.DE Co.', 'XNYS/NYS-MAIN', '', 643, 'AAB.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 20,
            rowKey: 'AAC.L',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC LN', 'GBX', 'AAC.L London PLC', 'XLON/LSE-SETS', '', 690, 'AAC.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 21,
            rowKey: 'AAC.N',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC US', 'CAD', 'AAC.N Corporation', 'XNGS/NAS-GSM', '', 623, 'AAC.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 22,
            rowKey: 'AAC.OQ',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC OQ', 'USD', 'AAC.OQ Co.', 'XNYS/NYS-MAIN', '', 167, 'AAC.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 23,
            rowKey: 'AAC.AS',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC NL', 'EUR', 'AAC.AS B.V', 'XAMS/ENA-MAIN', '', 410, 'AAC.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 24,
            rowKey: 'AAC.OE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC OE', 'EUR', 'AAC.OE Co.', 'XNYS/NYS-MAIN', '', 928, 'AAC.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 25,
            rowKey: 'AAC.MI',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC MI', 'GBX', 'AAC.MI Co.', 'XNYS/NYS-MAIN', '', 900, 'AAC.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 26,
            rowKey: 'AAC.A',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC A', 'CAD', 'AAC.A Co.', 'XNYS/NYS-MAIN', '', 896, 'AAC.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 27,
            rowKey: 'AAC.PA',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC PA', 'USD', 'AAC.PA Co.', 'XNYS/NYS-MAIN', '', 934, 'AAC.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 28,
            rowKey: 'AAC.MC',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC MC', 'USD', 'AAC.MC Co.', 'XNYS/NYS-MAIN', '', 553, 'AAC.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 29,
            rowKey: 'AAC.DE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAC DE', 'EUR', 'AAC.DE Co.', 'XNYS/NYS-MAIN', '', 879, 'AAC.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 30,
            rowKey: 'AAD.L',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD LN', 'GBX', 'AAD.L London PLC', 'XLON/LSE-SETS', '', 943, 'AAD.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 31,
            rowKey: 'AAD.N',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD US', 'GBX', 'AAD.N Corporation', 'XNGS/NAS-GSM', '', 303, 'AAD.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 32,
            rowKey: 'AAD.OQ',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD OQ', 'CAD', 'AAD.OQ Co.', 'XNYS/NYS-MAIN', '', 430, 'AAD.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 33,
            rowKey: 'AAD.AS',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD NL', 'EUR', 'AAD.AS B.V', 'XAMS/ENA-MAIN', '', 628, 'AAD.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 34,
            rowKey: 'AAD.OE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD OE', 'CAD', 'AAD.OE Co.', 'XNYS/NYS-MAIN', '', 720, 'AAD.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 35,
            rowKey: 'AAD.MI',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD MI', 'EUR', 'AAD.MI Co.', 'XNYS/NYS-MAIN', '', 478, 'AAD.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 36,
            rowKey: 'AAD.A',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD A', 'CAD', 'AAD.A Co.', 'XNYS/NYS-MAIN', '', 759, 'AAD.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 37,
            rowKey: 'AAD.PA',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD PA', 'GBX', 'AAD.PA Co.', 'XNYS/NYS-MAIN', '', 697, 'AAD.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 38,
            rowKey: 'AAD.MC',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD MC', 'EUR', 'AAD.MC Co.', 'XNYS/NYS-MAIN', '', 68, 'AAD.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 39,
            rowKey: 'AAD.DE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAD DE', 'GBX', 'AAD.DE Co.', 'XNYS/NYS-MAIN', '', 199, 'AAD.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 40,
            rowKey: 'AAE.L',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE LN', 'USD', 'AAE.L London PLC', 'XLON/LSE-SETS', '', 873, 'AAE.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 41,
            rowKey: 'AAE.N',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE US', 'EUR', 'AAE.N Corporation', 'XNGS/NAS-GSM', '', 951, 'AAE.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 42,
            rowKey: 'AAE.OQ',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE OQ', 'EUR', 'AAE.OQ Co.', 'XNYS/NYS-MAIN', '', 793, 'AAE.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 43,
            rowKey: 'AAE.AS',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE NL', 'USD', 'AAE.AS B.V', 'XAMS/ENA-MAIN', '', 382, 'AAE.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 44,
            rowKey: 'AAE.OE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE OE', 'GBX', 'AAE.OE Co.', 'XNYS/NYS-MAIN', '', 578, 'AAE.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 45,
            rowKey: 'AAE.MI',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE MI', 'CAD', 'AAE.MI Co.', 'XNYS/NYS-MAIN', '', 328, 'AAE.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 46,
            rowKey: 'AAE.A',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE A', 'EUR', 'AAE.A Co.', 'XNYS/NYS-MAIN', '', 76, 'AAE.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 47,
            rowKey: 'AAE.PA',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE PA', 'CAD', 'AAE.PA Co.', 'XNYS/NYS-MAIN', '', 691, 'AAE.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 48,
            rowKey: 'AAE.MC',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE MC', 'GBX', 'AAE.MC Co.', 'XNYS/NYS-MAIN', '', 161, 'AAE.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 49,
            rowKey: 'AAE.DE',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAE DE', 'CAD', 'AAE.DE Co.', 'XNYS/NYS-MAIN', '', 57, 'AAE.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 50,
            rowKey: 'AAF.L',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAF LN', 'CAD', 'AAF.L London PLC', 'XLON/LSE-SETS', '', 201, 'AAF.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 51,
            rowKey: 'AAF.N',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAF US', 'USD', 'AAF.N Corporation', 'XNGS/NAS-GSM', '', 432, 'AAF.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 52,
            rowKey: 'AAF.OQ',
            updateType: 'U',
            ts: 1618002389771,
            sel: 0,
            data: ['AAF OQ', 'USD', 'AAF.OQ Co.', 'XNYS/NYS-MAIN', '', 80, 'AAF.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 53,
            rowKey: 'AAF.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF NL', 'CAD', 'AAF.AS B.V', 'XAMS/ENA-MAIN', '', 903, 'AAF.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 54,
            rowKey: 'AAF.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF OE', 'EUR', 'AAF.OE Co.', 'XNYS/NYS-MAIN', '', 206, 'AAF.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 55,
            rowKey: 'AAF.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF MI', 'USD', 'AAF.MI Co.', 'XNYS/NYS-MAIN', '', 911, 'AAF.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 56,
            rowKey: 'AAF.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF A', 'CAD', 'AAF.A Co.', 'XNYS/NYS-MAIN', '', 356, 'AAF.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 57,
            rowKey: 'AAF.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF PA', 'EUR', 'AAF.PA Co.', 'XNYS/NYS-MAIN', '', 211, 'AAF.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 58,
            rowKey: 'AAF.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF MC', 'CAD', 'AAF.MC Co.', 'XNYS/NYS-MAIN', '', 310, 'AAF.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 59,
            rowKey: 'AAF.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAF DE', 'USD', 'AAF.DE Co.', 'XNYS/NYS-MAIN', '', 654, 'AAF.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 60,
            rowKey: 'AAG.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG LN', 'USD', 'AAG.L London PLC', 'XLON/LSE-SETS', '', 169, 'AAG.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 61,
            rowKey: 'AAG.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG US', 'USD', 'AAG.N Corporation', 'XNGS/NAS-GSM', '', 408, 'AAG.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 62,
            rowKey: 'AAG.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG OQ', 'GBX', 'AAG.OQ Co.', 'XNYS/NYS-MAIN', '', 706, 'AAG.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 63,
            rowKey: 'AAG.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG NL', 'USD', 'AAG.AS B.V', 'XAMS/ENA-MAIN', '', 892, 'AAG.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 64,
            rowKey: 'AAG.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG OE', 'EUR', 'AAG.OE Co.', 'XNYS/NYS-MAIN', '', 568, 'AAG.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 65,
            rowKey: 'AAG.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG MI', 'EUR', 'AAG.MI Co.', 'XNYS/NYS-MAIN', '', 313, 'AAG.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 66,
            rowKey: 'AAG.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG A', 'USD', 'AAG.A Co.', 'XNYS/NYS-MAIN', '', 607, 'AAG.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 67,
            rowKey: 'AAG.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG PA', 'CAD', 'AAG.PA Co.', 'XNYS/NYS-MAIN', '', 451, 'AAG.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 68,
            rowKey: 'AAG.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG MC', 'GBX', 'AAG.MC Co.', 'XNYS/NYS-MAIN', '', 346, 'AAG.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 69,
            rowKey: 'AAG.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAG DE', 'GBX', 'AAG.DE Co.', 'XNYS/NYS-MAIN', '', 717, 'AAG.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 70,
            rowKey: 'AAH.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH LN', 'CAD', 'AAH.L London PLC', 'XLON/LSE-SETS', '', 404, 'AAH.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 71,
            rowKey: 'AAH.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH US', 'GBX', 'AAH.N Corporation', 'XNGS/NAS-GSM', '', 606, 'AAH.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 72,
            rowKey: 'AAH.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH OQ', 'USD', 'AAH.OQ Co.', 'XNYS/NYS-MAIN', '', 19, 'AAH.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 73,
            rowKey: 'AAH.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH NL', 'GBX', 'AAH.AS B.V', 'XAMS/ENA-MAIN', '', 429, 'AAH.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 74,
            rowKey: 'AAH.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH OE', 'EUR', 'AAH.OE Co.', 'XNYS/NYS-MAIN', '', 170, 'AAH.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 75,
            rowKey: 'AAH.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH MI', 'GBX', 'AAH.MI Co.', 'XNYS/NYS-MAIN', '', 234, 'AAH.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 76,
            rowKey: 'AAH.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH A', 'CAD', 'AAH.A Co.', 'XNYS/NYS-MAIN', '', 202, 'AAH.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 77,
            rowKey: 'AAH.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH PA', 'USD', 'AAH.PA Co.', 'XNYS/NYS-MAIN', '', 426, 'AAH.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 78,
            rowKey: 'AAH.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH MC', 'EUR', 'AAH.MC Co.', 'XNYS/NYS-MAIN', '', 444, 'AAH.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 79,
            rowKey: 'AAH.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAH DE', 'CAD', 'AAH.DE Co.', 'XNYS/NYS-MAIN', '', 134, 'AAH.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 80,
            rowKey: 'AAI.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI LN', 'GBX', 'AAI.L London PLC', 'XLON/LSE-SETS', '', 517, 'AAI.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 81,
            rowKey: 'AAI.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI US', 'GBX', 'AAI.N Corporation', 'XNGS/NAS-GSM', '', 169, 'AAI.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 82,
            rowKey: 'AAI.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI OQ', 'EUR', 'AAI.OQ Co.', 'XNYS/NYS-MAIN', '', 750, 'AAI.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 83,
            rowKey: 'AAI.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI NL', 'USD', 'AAI.AS B.V', 'XAMS/ENA-MAIN', '', 676, 'AAI.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 84,
            rowKey: 'AAI.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI OE', 'CAD', 'AAI.OE Co.', 'XNYS/NYS-MAIN', '', 823, 'AAI.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 85,
            rowKey: 'AAI.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI MI', 'EUR', 'AAI.MI Co.', 'XNYS/NYS-MAIN', '', 768, 'AAI.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 86,
            rowKey: 'AAI.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI A', 'EUR', 'AAI.A Co.', 'XNYS/NYS-MAIN', '', 856, 'AAI.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 87,
            rowKey: 'AAI.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI PA', 'GBX', 'AAI.PA Co.', 'XNYS/NYS-MAIN', '', 120, 'AAI.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 88,
            rowKey: 'AAI.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI MC', 'USD', 'AAI.MC Co.', 'XNYS/NYS-MAIN', '', 900, 'AAI.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 89,
            rowKey: 'AAI.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAI DE', 'CAD', 'AAI.DE Co.', 'XNYS/NYS-MAIN', '', 48, 'AAI.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 90,
            rowKey: 'AAJ.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ LN', 'USD', 'AAJ.L London PLC', 'XLON/LSE-SETS', '', 818, 'AAJ.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 91,
            rowKey: 'AAJ.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ US', 'USD', 'AAJ.N Corporation', 'XNGS/NAS-GSM', '', 581, 'AAJ.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 92,
            rowKey: 'AAJ.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ OQ', 'GBX', 'AAJ.OQ Co.', 'XNYS/NYS-MAIN', '', 761, 'AAJ.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 93,
            rowKey: 'AAJ.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ NL', 'CAD', 'AAJ.AS B.V', 'XAMS/ENA-MAIN', '', 435, 'AAJ.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 94,
            rowKey: 'AAJ.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ OE', 'EUR', 'AAJ.OE Co.', 'XNYS/NYS-MAIN', '', 407, 'AAJ.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 95,
            rowKey: 'AAJ.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ MI', 'GBX', 'AAJ.MI Co.', 'XNYS/NYS-MAIN', '', 269, 'AAJ.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 96,
            rowKey: 'AAJ.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ A', 'EUR', 'AAJ.A Co.', 'XNYS/NYS-MAIN', '', 774, 'AAJ.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 97,
            rowKey: 'AAJ.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ PA', 'USD', 'AAJ.PA Co.', 'XNYS/NYS-MAIN', '', 44, 'AAJ.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 98,
            rowKey: 'AAJ.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ MC', 'EUR', 'AAJ.MC Co.', 'XNYS/NYS-MAIN', '', 828, 'AAJ.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 99,
            rowKey: 'AAJ.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAJ DE', 'EUR', 'AAJ.DE Co.', 'XNYS/NYS-MAIN', '', 767, 'AAJ.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 100,
            rowKey: 'AAK.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK LN', 'EUR', 'AAK.L London PLC', 'XLON/LSE-SETS', '', 637, 'AAK.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 101,
            rowKey: 'AAK.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK US', 'GBX', 'AAK.N Corporation', 'XNGS/NAS-GSM', '', 44, 'AAK.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 102,
            rowKey: 'AAK.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK OQ', 'USD', 'AAK.OQ Co.', 'XNYS/NYS-MAIN', '', 647, 'AAK.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 103,
            rowKey: 'AAK.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK NL', 'USD', 'AAK.AS B.V', 'XAMS/ENA-MAIN', '', 312, 'AAK.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 104,
            rowKey: 'AAK.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK OE', 'GBX', 'AAK.OE Co.', 'XNYS/NYS-MAIN', '', 914, 'AAK.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 105,
            rowKey: 'AAK.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK MI', 'CAD', 'AAK.MI Co.', 'XNYS/NYS-MAIN', '', 568, 'AAK.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 106,
            rowKey: 'AAK.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK A', 'EUR', 'AAK.A Co.', 'XNYS/NYS-MAIN', '', 66, 'AAK.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 107,
            rowKey: 'AAK.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK PA', 'CAD', 'AAK.PA Co.', 'XNYS/NYS-MAIN', '', 325, 'AAK.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 108,
            rowKey: 'AAK.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK MC', 'EUR', 'AAK.MC Co.', 'XNYS/NYS-MAIN', '', 322, 'AAK.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 109,
            rowKey: 'AAK.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAK DE', 'USD', 'AAK.DE Co.', 'XNYS/NYS-MAIN', '', 126, 'AAK.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 110,
            rowKey: 'AAL.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL LN', 'GBX', 'AAL.L London PLC', 'XLON/LSE-SETS', '', 351, 'AAL.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 111,
            rowKey: 'AAL.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL US', 'CAD', 'AAL.N Corporation', 'XNGS/NAS-GSM', '', 524, 'AAL.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 112,
            rowKey: 'AAL.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL OQ', 'EUR', 'AAL.OQ Co.', 'XNYS/NYS-MAIN', '', 686, 'AAL.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 113,
            rowKey: 'AAL.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL NL', 'CAD', 'AAL.AS B.V', 'XAMS/ENA-MAIN', '', 751, 'AAL.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 114,
            rowKey: 'AAL.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL OE', 'CAD', 'AAL.OE Co.', 'XNYS/NYS-MAIN', '', 283, 'AAL.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 115,
            rowKey: 'AAL.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL MI', 'CAD', 'AAL.MI Co.', 'XNYS/NYS-MAIN', '', 888, 'AAL.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 116,
            rowKey: 'AAL.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL A', 'EUR', 'AAL.A Co.', 'XNYS/NYS-MAIN', '', 895, 'AAL.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 117,
            rowKey: 'AAL.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL PA', 'USD', 'AAL.PA Co.', 'XNYS/NYS-MAIN', '', 107, 'AAL.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 118,
            rowKey: 'AAL.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL MC', 'GBX', 'AAL.MC Co.', 'XNYS/NYS-MAIN', '', 269, 'AAL.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 119,
            rowKey: 'AAL.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAL DE', 'GBX', 'AAL.DE Co.', 'XNYS/NYS-MAIN', '', 308, 'AAL.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 120,
            rowKey: 'AAM.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM LN', 'EUR', 'AAM.L London PLC', 'XLON/LSE-SETS', '', 137, 'AAM.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 121,
            rowKey: 'AAM.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM US', 'GBX', 'AAM.N Corporation', 'XNGS/NAS-GSM', '', 730, 'AAM.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 122,
            rowKey: 'AAM.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM OQ', 'USD', 'AAM.OQ Co.', 'XNYS/NYS-MAIN', '', 509, 'AAM.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 123,
            rowKey: 'AAM.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM NL', 'USD', 'AAM.AS B.V', 'XAMS/ENA-MAIN', '', 852, 'AAM.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 124,
            rowKey: 'AAM.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM OE', 'EUR', 'AAM.OE Co.', 'XNYS/NYS-MAIN', '', 50, 'AAM.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 125,
            rowKey: 'AAM.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM MI', 'CAD', 'AAM.MI Co.', 'XNYS/NYS-MAIN', '', 943, 'AAM.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 126,
            rowKey: 'AAM.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM A', 'GBX', 'AAM.A Co.', 'XNYS/NYS-MAIN', '', 95, 'AAM.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 127,
            rowKey: 'AAM.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM PA', 'GBX', 'AAM.PA Co.', 'XNYS/NYS-MAIN', '', 937, 'AAM.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 128,
            rowKey: 'AAM.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM MC', 'USD', 'AAM.MC Co.', 'XNYS/NYS-MAIN', '', 377, 'AAM.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 129,
            rowKey: 'AAM.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAM DE', 'GBX', 'AAM.DE Co.', 'XNYS/NYS-MAIN', '', 917, 'AAM.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 130,
            rowKey: 'AAN.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN LN', 'EUR', 'AAN.L London PLC', 'XLON/LSE-SETS', '', 703, 'AAN.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 131,
            rowKey: 'AAN.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN US', 'CAD', 'AAN.N Corporation', 'XNGS/NAS-GSM', '', 243, 'AAN.N']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 132,
            rowKey: 'AAN.OQ',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN OQ', 'USD', 'AAN.OQ Co.', 'XNYS/NYS-MAIN', '', 785, 'AAN.OQ']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 133,
            rowKey: 'AAN.AS',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN NL', 'USD', 'AAN.AS B.V', 'XAMS/ENA-MAIN', '', 443, 'AAN.AS']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 134,
            rowKey: 'AAN.OE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN OE', 'USD', 'AAN.OE Co.', 'XNYS/NYS-MAIN', '', 693, 'AAN.OE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 135,
            rowKey: 'AAN.MI',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN MI', 'GBX', 'AAN.MI Co.', 'XNYS/NYS-MAIN', '', 102, 'AAN.MI']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 136,
            rowKey: 'AAN.A',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN A', 'EUR', 'AAN.A Co.', 'XNYS/NYS-MAIN', '', 965, 'AAN.A']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 137,
            rowKey: 'AAN.PA',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN PA', 'EUR', 'AAN.PA Co.', 'XNYS/NYS-MAIN', '', 34, 'AAN.PA']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 138,
            rowKey: 'AAN.MC',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN MC', 'USD', 'AAN.MC Co.', 'XNYS/NYS-MAIN', '', 184, 'AAN.MC']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 139,
            rowKey: 'AAN.DE',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAN DE', 'EUR', 'AAN.DE Co.', 'XNYS/NYS-MAIN', '', 296, 'AAN.DE']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 140,
            rowKey: 'AAO.L',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAO LN', 'GBX', 'AAO.L London PLC', 'XLON/LSE-SETS', '', 435, 'AAO.L']
          },
          {
            viewPortId: 'user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73',
            vpSize: 175760,
            rowIndex: 141,
            rowKey: 'AAO.N',
            updateType: 'U',
            ts: 1618002389772,
            sel: 0,
            data: ['AAO US', 'GBX', 'AAO.N Corporation', 'XNGS/NAS-GSM', '', 403, 'AAO.N']
          }
        ]
      },
      module: 'CORE'
    });

    const viewport = serverProxy.viewports.get('user-c3c310fa-6e53-447f-b76c-4d5f6ea59f73');
    expect(viewport.isTree).toBe(false);
  });
});
