import { ServerProxy, TEST_setRequestId } from '../servers/vuu/new-server-proxy';
import { createSubscription } from './test-utils';

const mockConnection = {
  send: jest.fn()
};
// const callback = jest.fn();
const callback = (message) => console.table(message.viewports['FKwxbagfE7Qf39QluAbtX'].rows);

describe('server-proxy-generated-test', () => {
  test('test with captures messages', () => {
    let state = undefined;

    const [clientSubscription] = createSubscription({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      bufferSize: 100
    });
    const serverProxy = new ServerProxy(mockConnection, callback);
    serverProxy.subscribe(clientSubscription);

    serverProxy.handleMessageFromServer({
      requestId: 'FKwxbagfE7Qf39QluAbtX',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CREATE_VP_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        table: 'instruments',
        range: { from: 0, to: 135 },
        columns: ['bbg', 'currency', 'description', 'exchange', 'isin', 'lotSize', 'ric'],
        sort: { sortDefs: [] },
        groupBy: [],
        filterSpec: { filter: '' }
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '6ff14cc2-5a94-435c-b5d0-51758f2c2ad2',
        isLast: true,
        timeStamp: 1617780599242,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: -1,
            rowKey: 'SIZE',
            updateType: 'SIZE',
            ts: 1617780599242,
            sel: 0,
            data: []
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 0,
            rowKey: 'AAA.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA LN', 'USD', 'AAA.L London PLC', 'XLON/LSE-SETS', '', 633, 'AAA.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 1,
            rowKey: 'AAA.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA US', 'EUR', 'AAA.N Corporation', 'XNGS/NAS-GSM', '', 220, 'AAA.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 2,
            rowKey: 'AAA.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA OQ', 'EUR', 'AAA.OQ Co.', 'XNYS/NYS-MAIN', '', 393, 'AAA.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 3,
            rowKey: 'AAA.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA NL', 'GBX', 'AAA.AS B.V', 'XAMS/ENA-MAIN', '', 449, 'AAA.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 4,
            rowKey: 'AAA.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA OE', 'GBX', 'AAA.OE Co.', 'XNYS/NYS-MAIN', '', 37, 'AAA.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 5,
            rowKey: 'AAA.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA MI', 'CAD', 'AAA.MI Co.', 'XNYS/NYS-MAIN', '', 38, 'AAA.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 6,
            rowKey: 'AAA.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA A', 'GBX', 'AAA.A Co.', 'XNYS/NYS-MAIN', '', 286, 'AAA.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 7,
            rowKey: 'AAA.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA PA', 'USD', 'AAA.PA Co.', 'XNYS/NYS-MAIN', '', 364, 'AAA.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 8,
            rowKey: 'AAA.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA MC', 'EUR', 'AAA.MC Co.', 'XNYS/NYS-MAIN', '', 12, 'AAA.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 9,
            rowKey: 'AAA.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAA DE', 'CAD', 'AAA.DE Co.', 'XNYS/NYS-MAIN', '', 927, 'AAA.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 10,
            rowKey: 'AAB.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB LN', 'GBX', 'AAB.L London PLC', 'XLON/LSE-SETS', '', 559, 'AAB.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 11,
            rowKey: 'AAB.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB US', 'CAD', 'AAB.N Corporation', 'XNGS/NAS-GSM', '', 946, 'AAB.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 12,
            rowKey: 'AAB.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB OQ', 'CAD', 'AAB.OQ Co.', 'XNYS/NYS-MAIN', '', 363, 'AAB.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 13,
            rowKey: 'AAB.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB NL', 'CAD', 'AAB.AS B.V', 'XAMS/ENA-MAIN', '', 696, 'AAB.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 14,
            rowKey: 'AAB.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB OE', 'EUR', 'AAB.OE Co.', 'XNYS/NYS-MAIN', '', 806, 'AAB.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 15,
            rowKey: 'AAB.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB MI', 'GBX', 'AAB.MI Co.', 'XNYS/NYS-MAIN', '', 44, 'AAB.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 16,
            rowKey: 'AAB.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB A', 'GBX', 'AAB.A Co.', 'XNYS/NYS-MAIN', '', 226, 'AAB.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 17,
            rowKey: 'AAB.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB PA', 'GBX', 'AAB.PA Co.', 'XNYS/NYS-MAIN', '', 54, 'AAB.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 18,
            rowKey: 'AAB.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB MC', 'USD', 'AAB.MC Co.', 'XNYS/NYS-MAIN', '', 618, 'AAB.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 19,
            rowKey: 'AAB.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAB DE', 'CAD', 'AAB.DE Co.', 'XNYS/NYS-MAIN', '', 643, 'AAB.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 20,
            rowKey: 'AAC.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC LN', 'GBX', 'AAC.L London PLC', 'XLON/LSE-SETS', '', 690, 'AAC.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 21,
            rowKey: 'AAC.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC US', 'CAD', 'AAC.N Corporation', 'XNGS/NAS-GSM', '', 623, 'AAC.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 22,
            rowKey: 'AAC.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC OQ', 'USD', 'AAC.OQ Co.', 'XNYS/NYS-MAIN', '', 167, 'AAC.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 23,
            rowKey: 'AAC.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC NL', 'EUR', 'AAC.AS B.V', 'XAMS/ENA-MAIN', '', 410, 'AAC.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 24,
            rowKey: 'AAC.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC OE', 'EUR', 'AAC.OE Co.', 'XNYS/NYS-MAIN', '', 928, 'AAC.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 25,
            rowKey: 'AAC.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC MI', 'GBX', 'AAC.MI Co.', 'XNYS/NYS-MAIN', '', 900, 'AAC.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 26,
            rowKey: 'AAC.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC A', 'CAD', 'AAC.A Co.', 'XNYS/NYS-MAIN', '', 896, 'AAC.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 27,
            rowKey: 'AAC.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC PA', 'USD', 'AAC.PA Co.', 'XNYS/NYS-MAIN', '', 934, 'AAC.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 28,
            rowKey: 'AAC.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC MC', 'USD', 'AAC.MC Co.', 'XNYS/NYS-MAIN', '', 553, 'AAC.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 29,
            rowKey: 'AAC.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAC DE', 'EUR', 'AAC.DE Co.', 'XNYS/NYS-MAIN', '', 879, 'AAC.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 30,
            rowKey: 'AAD.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD LN', 'GBX', 'AAD.L London PLC', 'XLON/LSE-SETS', '', 943, 'AAD.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 31,
            rowKey: 'AAD.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD US', 'GBX', 'AAD.N Corporation', 'XNGS/NAS-GSM', '', 303, 'AAD.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 32,
            rowKey: 'AAD.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD OQ', 'CAD', 'AAD.OQ Co.', 'XNYS/NYS-MAIN', '', 430, 'AAD.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 33,
            rowKey: 'AAD.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD NL', 'EUR', 'AAD.AS B.V', 'XAMS/ENA-MAIN', '', 628, 'AAD.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 34,
            rowKey: 'AAD.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD OE', 'CAD', 'AAD.OE Co.', 'XNYS/NYS-MAIN', '', 720, 'AAD.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 35,
            rowKey: 'AAD.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD MI', 'EUR', 'AAD.MI Co.', 'XNYS/NYS-MAIN', '', 478, 'AAD.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 36,
            rowKey: 'AAD.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD A', 'CAD', 'AAD.A Co.', 'XNYS/NYS-MAIN', '', 759, 'AAD.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 37,
            rowKey: 'AAD.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD PA', 'GBX', 'AAD.PA Co.', 'XNYS/NYS-MAIN', '', 697, 'AAD.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 38,
            rowKey: 'AAD.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD MC', 'EUR', 'AAD.MC Co.', 'XNYS/NYS-MAIN', '', 68, 'AAD.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 39,
            rowKey: 'AAD.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAD DE', 'GBX', 'AAD.DE Co.', 'XNYS/NYS-MAIN', '', 199, 'AAD.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 40,
            rowKey: 'AAE.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE LN', 'USD', 'AAE.L London PLC', 'XLON/LSE-SETS', '', 873, 'AAE.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 41,
            rowKey: 'AAE.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE US', 'EUR', 'AAE.N Corporation', 'XNGS/NAS-GSM', '', 951, 'AAE.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 42,
            rowKey: 'AAE.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE OQ', 'EUR', 'AAE.OQ Co.', 'XNYS/NYS-MAIN', '', 793, 'AAE.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 43,
            rowKey: 'AAE.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE NL', 'USD', 'AAE.AS B.V', 'XAMS/ENA-MAIN', '', 382, 'AAE.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 44,
            rowKey: 'AAE.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE OE', 'GBX', 'AAE.OE Co.', 'XNYS/NYS-MAIN', '', 578, 'AAE.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 45,
            rowKey: 'AAE.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE MI', 'CAD', 'AAE.MI Co.', 'XNYS/NYS-MAIN', '', 328, 'AAE.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 46,
            rowKey: 'AAE.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE A', 'EUR', 'AAE.A Co.', 'XNYS/NYS-MAIN', '', 76, 'AAE.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 47,
            rowKey: 'AAE.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE PA', 'CAD', 'AAE.PA Co.', 'XNYS/NYS-MAIN', '', 691, 'AAE.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 48,
            rowKey: 'AAE.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE MC', 'GBX', 'AAE.MC Co.', 'XNYS/NYS-MAIN', '', 161, 'AAE.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 49,
            rowKey: 'AAE.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAE DE', 'CAD', 'AAE.DE Co.', 'XNYS/NYS-MAIN', '', 57, 'AAE.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 50,
            rowKey: 'AAF.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF LN', 'CAD', 'AAF.L London PLC', 'XLON/LSE-SETS', '', 201, 'AAF.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 51,
            rowKey: 'AAF.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF US', 'USD', 'AAF.N Corporation', 'XNGS/NAS-GSM', '', 432, 'AAF.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 52,
            rowKey: 'AAF.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF OQ', 'USD', 'AAF.OQ Co.', 'XNYS/NYS-MAIN', '', 80, 'AAF.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 53,
            rowKey: 'AAF.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF NL', 'CAD', 'AAF.AS B.V', 'XAMS/ENA-MAIN', '', 903, 'AAF.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 54,
            rowKey: 'AAF.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF OE', 'EUR', 'AAF.OE Co.', 'XNYS/NYS-MAIN', '', 206, 'AAF.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 55,
            rowKey: 'AAF.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF MI', 'USD', 'AAF.MI Co.', 'XNYS/NYS-MAIN', '', 911, 'AAF.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 56,
            rowKey: 'AAF.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF A', 'CAD', 'AAF.A Co.', 'XNYS/NYS-MAIN', '', 356, 'AAF.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 57,
            rowKey: 'AAF.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF PA', 'EUR', 'AAF.PA Co.', 'XNYS/NYS-MAIN', '', 211, 'AAF.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 58,
            rowKey: 'AAF.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF MC', 'CAD', 'AAF.MC Co.', 'XNYS/NYS-MAIN', '', 310, 'AAF.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 59,
            rowKey: 'AAF.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAF DE', 'USD', 'AAF.DE Co.', 'XNYS/NYS-MAIN', '', 654, 'AAF.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 60,
            rowKey: 'AAG.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG LN', 'USD', 'AAG.L London PLC', 'XLON/LSE-SETS', '', 169, 'AAG.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 61,
            rowKey: 'AAG.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG US', 'USD', 'AAG.N Corporation', 'XNGS/NAS-GSM', '', 408, 'AAG.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 62,
            rowKey: 'AAG.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG OQ', 'GBX', 'AAG.OQ Co.', 'XNYS/NYS-MAIN', '', 706, 'AAG.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 63,
            rowKey: 'AAG.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG NL', 'USD', 'AAG.AS B.V', 'XAMS/ENA-MAIN', '', 892, 'AAG.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 64,
            rowKey: 'AAG.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG OE', 'EUR', 'AAG.OE Co.', 'XNYS/NYS-MAIN', '', 568, 'AAG.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 65,
            rowKey: 'AAG.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG MI', 'EUR', 'AAG.MI Co.', 'XNYS/NYS-MAIN', '', 313, 'AAG.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 66,
            rowKey: 'AAG.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG A', 'USD', 'AAG.A Co.', 'XNYS/NYS-MAIN', '', 607, 'AAG.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 67,
            rowKey: 'AAG.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG PA', 'CAD', 'AAG.PA Co.', 'XNYS/NYS-MAIN', '', 451, 'AAG.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 68,
            rowKey: 'AAG.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG MC', 'GBX', 'AAG.MC Co.', 'XNYS/NYS-MAIN', '', 346, 'AAG.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 69,
            rowKey: 'AAG.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAG DE', 'GBX', 'AAG.DE Co.', 'XNYS/NYS-MAIN', '', 717, 'AAG.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 70,
            rowKey: 'AAH.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH LN', 'CAD', 'AAH.L London PLC', 'XLON/LSE-SETS', '', 404, 'AAH.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 71,
            rowKey: 'AAH.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH US', 'GBX', 'AAH.N Corporation', 'XNGS/NAS-GSM', '', 606, 'AAH.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 72,
            rowKey: 'AAH.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH OQ', 'USD', 'AAH.OQ Co.', 'XNYS/NYS-MAIN', '', 19, 'AAH.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 73,
            rowKey: 'AAH.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH NL', 'GBX', 'AAH.AS B.V', 'XAMS/ENA-MAIN', '', 429, 'AAH.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 74,
            rowKey: 'AAH.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH OE', 'EUR', 'AAH.OE Co.', 'XNYS/NYS-MAIN', '', 170, 'AAH.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 75,
            rowKey: 'AAH.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH MI', 'GBX', 'AAH.MI Co.', 'XNYS/NYS-MAIN', '', 234, 'AAH.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 76,
            rowKey: 'AAH.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH A', 'CAD', 'AAH.A Co.', 'XNYS/NYS-MAIN', '', 202, 'AAH.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 77,
            rowKey: 'AAH.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH PA', 'USD', 'AAH.PA Co.', 'XNYS/NYS-MAIN', '', 426, 'AAH.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 78,
            rowKey: 'AAH.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH MC', 'EUR', 'AAH.MC Co.', 'XNYS/NYS-MAIN', '', 444, 'AAH.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 79,
            rowKey: 'AAH.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAH DE', 'CAD', 'AAH.DE Co.', 'XNYS/NYS-MAIN', '', 134, 'AAH.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 80,
            rowKey: 'AAI.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI LN', 'GBX', 'AAI.L London PLC', 'XLON/LSE-SETS', '', 517, 'AAI.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 81,
            rowKey: 'AAI.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI US', 'GBX', 'AAI.N Corporation', 'XNGS/NAS-GSM', '', 169, 'AAI.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 82,
            rowKey: 'AAI.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI OQ', 'EUR', 'AAI.OQ Co.', 'XNYS/NYS-MAIN', '', 750, 'AAI.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 83,
            rowKey: 'AAI.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI NL', 'USD', 'AAI.AS B.V', 'XAMS/ENA-MAIN', '', 676, 'AAI.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 84,
            rowKey: 'AAI.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI OE', 'CAD', 'AAI.OE Co.', 'XNYS/NYS-MAIN', '', 823, 'AAI.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 85,
            rowKey: 'AAI.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI MI', 'EUR', 'AAI.MI Co.', 'XNYS/NYS-MAIN', '', 768, 'AAI.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 86,
            rowKey: 'AAI.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI A', 'EUR', 'AAI.A Co.', 'XNYS/NYS-MAIN', '', 856, 'AAI.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 87,
            rowKey: 'AAI.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI PA', 'GBX', 'AAI.PA Co.', 'XNYS/NYS-MAIN', '', 120, 'AAI.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 88,
            rowKey: 'AAI.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI MC', 'USD', 'AAI.MC Co.', 'XNYS/NYS-MAIN', '', 900, 'AAI.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 89,
            rowKey: 'AAI.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAI DE', 'CAD', 'AAI.DE Co.', 'XNYS/NYS-MAIN', '', 48, 'AAI.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 90,
            rowKey: 'AAJ.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ LN', 'USD', 'AAJ.L London PLC', 'XLON/LSE-SETS', '', 818, 'AAJ.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 91,
            rowKey: 'AAJ.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ US', 'USD', 'AAJ.N Corporation', 'XNGS/NAS-GSM', '', 581, 'AAJ.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 92,
            rowKey: 'AAJ.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ OQ', 'GBX', 'AAJ.OQ Co.', 'XNYS/NYS-MAIN', '', 761, 'AAJ.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 93,
            rowKey: 'AAJ.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ NL', 'CAD', 'AAJ.AS B.V', 'XAMS/ENA-MAIN', '', 435, 'AAJ.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 94,
            rowKey: 'AAJ.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ OE', 'EUR', 'AAJ.OE Co.', 'XNYS/NYS-MAIN', '', 407, 'AAJ.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 95,
            rowKey: 'AAJ.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ MI', 'GBX', 'AAJ.MI Co.', 'XNYS/NYS-MAIN', '', 269, 'AAJ.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 96,
            rowKey: 'AAJ.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ A', 'EUR', 'AAJ.A Co.', 'XNYS/NYS-MAIN', '', 774, 'AAJ.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 97,
            rowKey: 'AAJ.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ PA', 'USD', 'AAJ.PA Co.', 'XNYS/NYS-MAIN', '', 44, 'AAJ.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 98,
            rowKey: 'AAJ.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ MC', 'EUR', 'AAJ.MC Co.', 'XNYS/NYS-MAIN', '', 828, 'AAJ.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 99,
            rowKey: 'AAJ.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAJ DE', 'EUR', 'AAJ.DE Co.', 'XNYS/NYS-MAIN', '', 767, 'AAJ.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 100,
            rowKey: 'AAK.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK LN', 'EUR', 'AAK.L London PLC', 'XLON/LSE-SETS', '', 637, 'AAK.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 101,
            rowKey: 'AAK.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK US', 'GBX', 'AAK.N Corporation', 'XNGS/NAS-GSM', '', 44, 'AAK.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 102,
            rowKey: 'AAK.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK OQ', 'USD', 'AAK.OQ Co.', 'XNYS/NYS-MAIN', '', 647, 'AAK.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 103,
            rowKey: 'AAK.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK NL', 'USD', 'AAK.AS B.V', 'XAMS/ENA-MAIN', '', 312, 'AAK.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 104,
            rowKey: 'AAK.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK OE', 'GBX', 'AAK.OE Co.', 'XNYS/NYS-MAIN', '', 914, 'AAK.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 105,
            rowKey: 'AAK.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK MI', 'CAD', 'AAK.MI Co.', 'XNYS/NYS-MAIN', '', 568, 'AAK.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 106,
            rowKey: 'AAK.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK A', 'EUR', 'AAK.A Co.', 'XNYS/NYS-MAIN', '', 66, 'AAK.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 107,
            rowKey: 'AAK.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK PA', 'CAD', 'AAK.PA Co.', 'XNYS/NYS-MAIN', '', 325, 'AAK.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 108,
            rowKey: 'AAK.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK MC', 'EUR', 'AAK.MC Co.', 'XNYS/NYS-MAIN', '', 322, 'AAK.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 109,
            rowKey: 'AAK.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAK DE', 'USD', 'AAK.DE Co.', 'XNYS/NYS-MAIN', '', 126, 'AAK.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 110,
            rowKey: 'AAL.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL LN', 'GBX', 'AAL.L London PLC', 'XLON/LSE-SETS', '', 351, 'AAL.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 111,
            rowKey: 'AAL.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL US', 'CAD', 'AAL.N Corporation', 'XNGS/NAS-GSM', '', 524, 'AAL.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 112,
            rowKey: 'AAL.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL OQ', 'EUR', 'AAL.OQ Co.', 'XNYS/NYS-MAIN', '', 686, 'AAL.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 113,
            rowKey: 'AAL.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL NL', 'CAD', 'AAL.AS B.V', 'XAMS/ENA-MAIN', '', 751, 'AAL.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 114,
            rowKey: 'AAL.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL OE', 'CAD', 'AAL.OE Co.', 'XNYS/NYS-MAIN', '', 283, 'AAL.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 115,
            rowKey: 'AAL.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL MI', 'CAD', 'AAL.MI Co.', 'XNYS/NYS-MAIN', '', 888, 'AAL.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 116,
            rowKey: 'AAL.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL A', 'EUR', 'AAL.A Co.', 'XNYS/NYS-MAIN', '', 895, 'AAL.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 117,
            rowKey: 'AAL.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL PA', 'USD', 'AAL.PA Co.', 'XNYS/NYS-MAIN', '', 107, 'AAL.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 118,
            rowKey: 'AAL.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL MC', 'GBX', 'AAL.MC Co.', 'XNYS/NYS-MAIN', '', 269, 'AAL.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 119,
            rowKey: 'AAL.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAL DE', 'GBX', 'AAL.DE Co.', 'XNYS/NYS-MAIN', '', 308, 'AAL.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 120,
            rowKey: 'AAM.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM LN', 'EUR', 'AAM.L London PLC', 'XLON/LSE-SETS', '', 137, 'AAM.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 121,
            rowKey: 'AAM.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM US', 'GBX', 'AAM.N Corporation', 'XNGS/NAS-GSM', '', 730, 'AAM.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 122,
            rowKey: 'AAM.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM OQ', 'USD', 'AAM.OQ Co.', 'XNYS/NYS-MAIN', '', 509, 'AAM.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 123,
            rowKey: 'AAM.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM NL', 'USD', 'AAM.AS B.V', 'XAMS/ENA-MAIN', '', 852, 'AAM.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 124,
            rowKey: 'AAM.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM OE', 'EUR', 'AAM.OE Co.', 'XNYS/NYS-MAIN', '', 50, 'AAM.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 125,
            rowKey: 'AAM.MI',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM MI', 'CAD', 'AAM.MI Co.', 'XNYS/NYS-MAIN', '', 943, 'AAM.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 126,
            rowKey: 'AAM.A',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM A', 'GBX', 'AAM.A Co.', 'XNYS/NYS-MAIN', '', 95, 'AAM.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 127,
            rowKey: 'AAM.PA',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM PA', 'GBX', 'AAM.PA Co.', 'XNYS/NYS-MAIN', '', 937, 'AAM.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 128,
            rowKey: 'AAM.MC',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM MC', 'USD', 'AAM.MC Co.', 'XNYS/NYS-MAIN', '', 377, 'AAM.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 129,
            rowKey: 'AAM.DE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAM DE', 'GBX', 'AAM.DE Co.', 'XNYS/NYS-MAIN', '', 917, 'AAM.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 130,
            rowKey: 'AAN.L',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAN LN', 'EUR', 'AAN.L London PLC', 'XLON/LSE-SETS', '', 703, 'AAN.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 131,
            rowKey: 'AAN.N',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAN US', 'CAD', 'AAN.N Corporation', 'XNGS/NAS-GSM', '', 243, 'AAN.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 132,
            rowKey: 'AAN.OQ',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAN OQ', 'USD', 'AAN.OQ Co.', 'XNYS/NYS-MAIN', '', 785, 'AAN.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 133,
            rowKey: 'AAN.AS',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAN NL', 'USD', 'AAN.AS B.V', 'XAMS/ENA-MAIN', '', 443, 'AAN.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 134,
            rowKey: 'AAN.OE',
            updateType: 'U',
            ts: 1617780599242,
            sel: 0,
            data: ['AAN OE', 'USD', 'AAN.OE Co.', 'XNYS/NYS-MAIN', '', 693, 'AAN.OE']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 2, hi: 37 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 6, hi: 41 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 11, hi: 46 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 14, hi: 49 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 22, hi: 57 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 30, hi: 65 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 38, hi: 73 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 45, hi: 80 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 52, hi: 87 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 57, hi: 92 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 62, hi: 97 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 66, hi: 101 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 70, hi: 105 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 75, hi: 110 },
      dataType: 'rowData'
    });

    TEST_setRequestId(15);

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 76, hi: 111 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '15',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 26,
        to: 161
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '1af74f85-ce61-476b-8196-d60eba7364dd',
        isLast: true,
        timeStamp: 1617780603143,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 135,
            rowKey: 'AAN.MI',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAN MI', 'GBX', 'AAN.MI Co.', 'XNYS/NYS-MAIN', '', 102, 'AAN.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 136,
            rowKey: 'AAN.A',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAN A', 'EUR', 'AAN.A Co.', 'XNYS/NYS-MAIN', '', 965, 'AAN.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 137,
            rowKey: 'AAN.PA',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAN PA', 'EUR', 'AAN.PA Co.', 'XNYS/NYS-MAIN', '', 34, 'AAN.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 138,
            rowKey: 'AAN.MC',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAN MC', 'USD', 'AAN.MC Co.', 'XNYS/NYS-MAIN', '', 184, 'AAN.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 139,
            rowKey: 'AAN.DE',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAN DE', 'EUR', 'AAN.DE Co.', 'XNYS/NYS-MAIN', '', 296, 'AAN.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 140,
            rowKey: 'AAO.L',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO LN', 'GBX', 'AAO.L London PLC', 'XLON/LSE-SETS', '', 435, 'AAO.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 141,
            rowKey: 'AAO.N',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO US', 'GBX', 'AAO.N Corporation', 'XNGS/NAS-GSM', '', 403, 'AAO.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 142,
            rowKey: 'AAO.OQ',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO OQ', 'GBX', 'AAO.OQ Co.', 'XNYS/NYS-MAIN', '', 524, 'AAO.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 143,
            rowKey: 'AAO.AS',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO NL', 'CAD', 'AAO.AS B.V', 'XAMS/ENA-MAIN', '', 750, 'AAO.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 144,
            rowKey: 'AAO.OE',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO OE', 'EUR', 'AAO.OE Co.', 'XNYS/NYS-MAIN', '', 691, 'AAO.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 145,
            rowKey: 'AAO.MI',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO MI', 'CAD', 'AAO.MI Co.', 'XNYS/NYS-MAIN', '', 659, 'AAO.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 146,
            rowKey: 'AAO.A',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO A', 'EUR', 'AAO.A Co.', 'XNYS/NYS-MAIN', '', 870, 'AAO.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 147,
            rowKey: 'AAO.PA',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO PA', 'CAD', 'AAO.PA Co.', 'XNYS/NYS-MAIN', '', 380, 'AAO.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 148,
            rowKey: 'AAO.MC',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO MC', 'USD', 'AAO.MC Co.', 'XNYS/NYS-MAIN', '', 927, 'AAO.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 149,
            rowKey: 'AAO.DE',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAO DE', 'GBX', 'AAO.DE Co.', 'XNYS/NYS-MAIN', '', 920, 'AAO.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 150,
            rowKey: 'AAP.L',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP LN', 'USD', 'AAP.L London PLC', 'XLON/LSE-SETS', '', 580, 'AAP.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 151,
            rowKey: 'AAP.N',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP US', 'EUR', 'AAP.N Corporation', 'XNGS/NAS-GSM', '', 684, 'AAP.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 152,
            rowKey: 'AAP.OQ',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP OQ', 'USD', 'AAP.OQ Co.', 'XNYS/NYS-MAIN', '', 642, 'AAP.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 153,
            rowKey: 'AAP.AS',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP NL', 'USD', 'AAP.AS B.V', 'XAMS/ENA-MAIN', '', 730, 'AAP.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 154,
            rowKey: 'AAP.OE',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP OE', 'EUR', 'AAP.OE Co.', 'XNYS/NYS-MAIN', '', 455, 'AAP.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 155,
            rowKey: 'AAP.MI',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP MI', 'CAD', 'AAP.MI Co.', 'XNYS/NYS-MAIN', '', 563, 'AAP.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 156,
            rowKey: 'AAP.A',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP A', 'EUR', 'AAP.A Co.', 'XNYS/NYS-MAIN', '', 291, 'AAP.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 157,
            rowKey: 'AAP.PA',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP PA', 'USD', 'AAP.PA Co.', 'XNYS/NYS-MAIN', '', 981, 'AAP.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 158,
            rowKey: 'AAP.MC',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP MC', 'CAD', 'AAP.MC Co.', 'XNYS/NYS-MAIN', '', 394, 'AAP.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 159,
            rowKey: 'AAP.DE',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAP DE', 'GBX', 'AAP.DE Co.', 'XNYS/NYS-MAIN', '', 17, 'AAP.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 160,
            rowKey: 'AAQ.L',
            updateType: 'U',
            ts: 1617780603143,
            sel: 0,
            data: ['AAQ LN', 'GBX', 'AAQ.L London PLC', 'XLON/LSE-SETS', '', 529, 'AAQ.L']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 77, hi: 112 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 79, hi: 114 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 83, hi: 118 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 87, hi: 122 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 92, hi: 127 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 99, hi: 134 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 106, hi: 141 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '22',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 56,
        to: 191
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '7d5faaf7-28a8-4766-86c5-a423a65a5759',
        isLast: true,
        timeStamp: 1617780603376,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 161,
            rowKey: 'AAQ.N',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ US', 'EUR', 'AAQ.N Corporation', 'XNGS/NAS-GSM', '', 99, 'AAQ.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 162,
            rowKey: 'AAQ.OQ',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ OQ', 'USD', 'AAQ.OQ Co.', 'XNYS/NYS-MAIN', '', 298, 'AAQ.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 163,
            rowKey: 'AAQ.AS',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ NL', 'USD', 'AAQ.AS B.V', 'XAMS/ENA-MAIN', '', 695, 'AAQ.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 164,
            rowKey: 'AAQ.OE',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ OE', 'USD', 'AAQ.OE Co.', 'XNYS/NYS-MAIN', '', 341, 'AAQ.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 165,
            rowKey: 'AAQ.MI',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ MI', 'CAD', 'AAQ.MI Co.', 'XNYS/NYS-MAIN', '', 141, 'AAQ.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 166,
            rowKey: 'AAQ.A',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ A', 'CAD', 'AAQ.A Co.', 'XNYS/NYS-MAIN', '', 557, 'AAQ.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 167,
            rowKey: 'AAQ.PA',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ PA', 'USD', 'AAQ.PA Co.', 'XNYS/NYS-MAIN', '', 928, 'AAQ.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 168,
            rowKey: 'AAQ.MC',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ MC', 'CAD', 'AAQ.MC Co.', 'XNYS/NYS-MAIN', '', 981, 'AAQ.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 169,
            rowKey: 'AAQ.DE',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAQ DE', 'CAD', 'AAQ.DE Co.', 'XNYS/NYS-MAIN', '', 448, 'AAQ.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 170,
            rowKey: 'AAR.L',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR LN', 'USD', 'AAR.L London PLC', 'XLON/LSE-SETS', '', 565, 'AAR.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 171,
            rowKey: 'AAR.N',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR US', 'GBX', 'AAR.N Corporation', 'XNGS/NAS-GSM', '', 58, 'AAR.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 172,
            rowKey: 'AAR.OQ',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR OQ', 'USD', 'AAR.OQ Co.', 'XNYS/NYS-MAIN', '', 861, 'AAR.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 173,
            rowKey: 'AAR.AS',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR NL', 'USD', 'AAR.AS B.V', 'XAMS/ENA-MAIN', '', 393, 'AAR.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 174,
            rowKey: 'AAR.OE',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR OE', 'GBX', 'AAR.OE Co.', 'XNYS/NYS-MAIN', '', 900, 'AAR.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 175,
            rowKey: 'AAR.MI',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR MI', 'EUR', 'AAR.MI Co.', 'XNYS/NYS-MAIN', '', 180, 'AAR.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 176,
            rowKey: 'AAR.A',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR A', 'CAD', 'AAR.A Co.', 'XNYS/NYS-MAIN', '', 101, 'AAR.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 177,
            rowKey: 'AAR.PA',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR PA', 'EUR', 'AAR.PA Co.', 'XNYS/NYS-MAIN', '', 916, 'AAR.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 178,
            rowKey: 'AAR.MC',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR MC', 'CAD', 'AAR.MC Co.', 'XNYS/NYS-MAIN', '', 415, 'AAR.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 179,
            rowKey: 'AAR.DE',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAR DE', 'GBX', 'AAR.DE Co.', 'XNYS/NYS-MAIN', '', 887, 'AAR.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 180,
            rowKey: 'AAS.L',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS LN', 'GBX', 'AAS.L London PLC', 'XLON/LSE-SETS', '', 856, 'AAS.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 181,
            rowKey: 'AAS.N',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS US', 'CAD', 'AAS.N Corporation', 'XNGS/NAS-GSM', '', 638, 'AAS.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 182,
            rowKey: 'AAS.OQ',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS OQ', 'EUR', 'AAS.OQ Co.', 'XNYS/NYS-MAIN', '', 821, 'AAS.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 183,
            rowKey: 'AAS.AS',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS NL', 'CAD', 'AAS.AS B.V', 'XAMS/ENA-MAIN', '', 783, 'AAS.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 184,
            rowKey: 'AAS.OE',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS OE', 'EUR', 'AAS.OE Co.', 'XNYS/NYS-MAIN', '', 80, 'AAS.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 185,
            rowKey: 'AAS.MI',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS MI', 'CAD', 'AAS.MI Co.', 'XNYS/NYS-MAIN', '', 456, 'AAS.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 186,
            rowKey: 'AAS.A',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS A', 'EUR', 'AAS.A Co.', 'XNYS/NYS-MAIN', '', 295, 'AAS.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 187,
            rowKey: 'AAS.PA',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS PA', 'GBX', 'AAS.PA Co.', 'XNYS/NYS-MAIN', '', 857, 'AAS.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 188,
            rowKey: 'AAS.MC',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS MC', 'CAD', 'AAS.MC Co.', 'XNYS/NYS-MAIN', '', 621, 'AAS.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 189,
            rowKey: 'AAS.DE',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAS DE', 'USD', 'AAS.DE Co.', 'XNYS/NYS-MAIN', '', 260, 'AAS.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 190,
            rowKey: 'AAT.L',
            updateType: 'U',
            ts: 1617780603376,
            sel: 0,
            data: ['AAT LN', 'USD', 'AAT.L London PLC', 'XLON/LSE-SETS', '', 759, 'AAT.L']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 113, hi: 148 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 119, hi: 154 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 124, hi: 159 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 128, hi: 163 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 132, hi: 167 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '27',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 82,
        to: 217
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '22d9c1f9-d0db-48ab-a704-36312f82763b',
        isLast: true,
        timeStamp: 1617780603540,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 191,
            rowKey: 'AAT.N',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT US', 'USD', 'AAT.N Corporation', 'XNGS/NAS-GSM', '', 380, 'AAT.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 192,
            rowKey: 'AAT.OQ',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT OQ', 'EUR', 'AAT.OQ Co.', 'XNYS/NYS-MAIN', '', 525, 'AAT.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 193,
            rowKey: 'AAT.AS',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT NL', 'EUR', 'AAT.AS B.V', 'XAMS/ENA-MAIN', '', 543, 'AAT.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 194,
            rowKey: 'AAT.OE',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT OE', 'USD', 'AAT.OE Co.', 'XNYS/NYS-MAIN', '', 290, 'AAT.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 195,
            rowKey: 'AAT.MI',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT MI', 'GBX', 'AAT.MI Co.', 'XNYS/NYS-MAIN', '', 842, 'AAT.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 196,
            rowKey: 'AAT.A',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT A', 'GBX', 'AAT.A Co.', 'XNYS/NYS-MAIN', '', 298, 'AAT.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 197,
            rowKey: 'AAT.PA',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT PA', 'USD', 'AAT.PA Co.', 'XNYS/NYS-MAIN', '', 583, 'AAT.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 198,
            rowKey: 'AAT.MC',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT MC', 'CAD', 'AAT.MC Co.', 'XNYS/NYS-MAIN', '', 216, 'AAT.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 199,
            rowKey: 'AAT.DE',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAT DE', 'GBX', 'AAT.DE Co.', 'XNYS/NYS-MAIN', '', 453, 'AAT.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 200,
            rowKey: 'AAU.L',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU LN', 'EUR', 'AAU.L London PLC', 'XLON/LSE-SETS', '', 481, 'AAU.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 201,
            rowKey: 'AAU.N',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU US', 'CAD', 'AAU.N Corporation', 'XNGS/NAS-GSM', '', 277, 'AAU.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 202,
            rowKey: 'AAU.OQ',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU OQ', 'GBX', 'AAU.OQ Co.', 'XNYS/NYS-MAIN', '', 984, 'AAU.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 203,
            rowKey: 'AAU.AS',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU NL', 'CAD', 'AAU.AS B.V', 'XAMS/ENA-MAIN', '', 812, 'AAU.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 204,
            rowKey: 'AAU.OE',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU OE', 'EUR', 'AAU.OE Co.', 'XNYS/NYS-MAIN', '', 439, 'AAU.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 205,
            rowKey: 'AAU.MI',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU MI', 'EUR', 'AAU.MI Co.', 'XNYS/NYS-MAIN', '', 810, 'AAU.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 206,
            rowKey: 'AAU.A',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU A', 'USD', 'AAU.A Co.', 'XNYS/NYS-MAIN', '', 455, 'AAU.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 207,
            rowKey: 'AAU.PA',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU PA', 'EUR', 'AAU.PA Co.', 'XNYS/NYS-MAIN', '', 853, 'AAU.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 208,
            rowKey: 'AAU.MC',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU MC', 'GBX', 'AAU.MC Co.', 'XNYS/NYS-MAIN', '', 980, 'AAU.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 209,
            rowKey: 'AAU.DE',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAU DE', 'EUR', 'AAU.DE Co.', 'XNYS/NYS-MAIN', '', 651, 'AAU.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 210,
            rowKey: 'AAV.L',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV LN', 'CAD', 'AAV.L London PLC', 'XLON/LSE-SETS', '', 807, 'AAV.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 211,
            rowKey: 'AAV.N',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV US', 'GBX', 'AAV.N Corporation', 'XNGS/NAS-GSM', '', 642, 'AAV.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 212,
            rowKey: 'AAV.OQ',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV OQ', 'EUR', 'AAV.OQ Co.', 'XNYS/NYS-MAIN', '', 425, 'AAV.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 213,
            rowKey: 'AAV.AS',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV NL', 'USD', 'AAV.AS B.V', 'XAMS/ENA-MAIN', '', 174, 'AAV.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 214,
            rowKey: 'AAV.OE',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV OE', 'GBX', 'AAV.OE Co.', 'XNYS/NYS-MAIN', '', 41, 'AAV.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 215,
            rowKey: 'AAV.MI',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV MI', 'CAD', 'AAV.MI Co.', 'XNYS/NYS-MAIN', '', 998, 'AAV.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 216,
            rowKey: 'AAV.A',
            updateType: 'U',
            ts: 1617780603540,
            sel: 0,
            data: ['AAV A', 'GBX', 'AAV.A Co.', 'XNYS/NYS-MAIN', '', 555, 'AAV.A']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 135, hi: 170 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 138, hi: 173 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 140, hi: 175 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 141, hi: 176 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 145, hi: 180 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 148, hi: 183 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 155, hi: 190 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 164, hi: 199 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '35',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 114,
        to: 249
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '28610c73-a2f5-4bfc-a545-660287bb67ed',
        isLast: true,
        timeStamp: 1617780603848,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 217,
            rowKey: 'AAV.PA',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAV PA', 'GBX', 'AAV.PA Co.', 'XNYS/NYS-MAIN', '', 763, 'AAV.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 218,
            rowKey: 'AAV.MC',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAV MC', 'EUR', 'AAV.MC Co.', 'XNYS/NYS-MAIN', '', 30, 'AAV.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 219,
            rowKey: 'AAV.DE',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAV DE', 'EUR', 'AAV.DE Co.', 'XNYS/NYS-MAIN', '', 223, 'AAV.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 220,
            rowKey: 'AAW.L',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW LN', 'USD', 'AAW.L London PLC', 'XLON/LSE-SETS', '', 199, 'AAW.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 221,
            rowKey: 'AAW.N',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW US', 'USD', 'AAW.N Corporation', 'XNGS/NAS-GSM', '', 205, 'AAW.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 222,
            rowKey: 'AAW.OQ',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW OQ', 'CAD', 'AAW.OQ Co.', 'XNYS/NYS-MAIN', '', 239, 'AAW.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 223,
            rowKey: 'AAW.AS',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW NL', 'GBX', 'AAW.AS B.V', 'XAMS/ENA-MAIN', '', 771, 'AAW.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 224,
            rowKey: 'AAW.OE',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW OE', 'USD', 'AAW.OE Co.', 'XNYS/NYS-MAIN', '', 854, 'AAW.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 225,
            rowKey: 'AAW.MI',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW MI', 'GBX', 'AAW.MI Co.', 'XNYS/NYS-MAIN', '', 737, 'AAW.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 226,
            rowKey: 'AAW.A',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW A', 'GBX', 'AAW.A Co.', 'XNYS/NYS-MAIN', '', 466, 'AAW.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 227,
            rowKey: 'AAW.PA',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW PA', 'GBX', 'AAW.PA Co.', 'XNYS/NYS-MAIN', '', 421, 'AAW.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 228,
            rowKey: 'AAW.MC',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW MC', 'EUR', 'AAW.MC Co.', 'XNYS/NYS-MAIN', '', 520, 'AAW.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 229,
            rowKey: 'AAW.DE',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAW DE', 'EUR', 'AAW.DE Co.', 'XNYS/NYS-MAIN', '', 124, 'AAW.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 230,
            rowKey: 'AAX.L',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX LN', 'CAD', 'AAX.L London PLC', 'XLON/LSE-SETS', '', 414, 'AAX.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 231,
            rowKey: 'AAX.N',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX US', 'EUR', 'AAX.N Corporation', 'XNGS/NAS-GSM', '', 398, 'AAX.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 232,
            rowKey: 'AAX.OQ',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX OQ', 'GBX', 'AAX.OQ Co.', 'XNYS/NYS-MAIN', '', 442, 'AAX.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 233,
            rowKey: 'AAX.AS',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX NL', 'EUR', 'AAX.AS B.V', 'XAMS/ENA-MAIN', '', 335, 'AAX.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 234,
            rowKey: 'AAX.OE',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX OE', 'GBX', 'AAX.OE Co.', 'XNYS/NYS-MAIN', '', 787, 'AAX.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 235,
            rowKey: 'AAX.MI',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX MI', 'USD', 'AAX.MI Co.', 'XNYS/NYS-MAIN', '', 326, 'AAX.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 236,
            rowKey: 'AAX.A',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX A', 'CAD', 'AAX.A Co.', 'XNYS/NYS-MAIN', '', 418, 'AAX.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 237,
            rowKey: 'AAX.PA',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX PA', 'GBX', 'AAX.PA Co.', 'XNYS/NYS-MAIN', '', 732, 'AAX.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 238,
            rowKey: 'AAX.MC',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX MC', 'CAD', 'AAX.MC Co.', 'XNYS/NYS-MAIN', '', 300, 'AAX.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 239,
            rowKey: 'AAX.DE',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAX DE', 'EUR', 'AAX.DE Co.', 'XNYS/NYS-MAIN', '', 50, 'AAX.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 240,
            rowKey: 'AAY.L',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY LN', 'EUR', 'AAY.L London PLC', 'XLON/LSE-SETS', '', 511, 'AAY.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 241,
            rowKey: 'AAY.N',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY US', 'USD', 'AAY.N Corporation', 'XNGS/NAS-GSM', '', 239, 'AAY.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 242,
            rowKey: 'AAY.OQ',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY OQ', 'CAD', 'AAY.OQ Co.', 'XNYS/NYS-MAIN', '', 94, 'AAY.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 243,
            rowKey: 'AAY.AS',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY NL', 'GBX', 'AAY.AS B.V', 'XAMS/ENA-MAIN', '', 581, 'AAY.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 244,
            rowKey: 'AAY.OE',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY OE', 'USD', 'AAY.OE Co.', 'XNYS/NYS-MAIN', '', 251, 'AAY.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 245,
            rowKey: 'AAY.MI',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY MI', 'CAD', 'AAY.MI Co.', 'XNYS/NYS-MAIN', '', 471, 'AAY.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 246,
            rowKey: 'AAY.A',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY A', 'CAD', 'AAY.A Co.', 'XNYS/NYS-MAIN', '', 336, 'AAY.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 247,
            rowKey: 'AAY.PA',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY PA', 'GBX', 'AAY.PA Co.', 'XNYS/NYS-MAIN', '', 89, 'AAY.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 248,
            rowKey: 'AAY.MC',
            updateType: 'U',
            ts: 1617780603848,
            sel: 0,
            data: ['AAY MC', 'USD', 'AAY.MC Co.', 'XNYS/NYS-MAIN', '', 170, 'AAY.MC']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 172, hi: 207 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 180, hi: 215 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 187, hi: 222 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 193, hi: 228 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '39',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 143,
        to: 278
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: 'cfa4636b-3bcf-4964-971d-3d36b0aba934',
        isLast: true,
        timeStamp: 1617780603976,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 249,
            rowKey: 'AAY.DE',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAY DE', 'GBX', 'AAY.DE Co.', 'XNYS/NYS-MAIN', '', 804, 'AAY.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 250,
            rowKey: 'AAZ.L',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ LN', 'CAD', 'AAZ.L London PLC', 'XLON/LSE-SETS', '', 667, 'AAZ.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 251,
            rowKey: 'AAZ.N',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ US', 'USD', 'AAZ.N Corporation', 'XNGS/NAS-GSM', '', 757, 'AAZ.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 252,
            rowKey: 'AAZ.OQ',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ OQ', 'USD', 'AAZ.OQ Co.', 'XNYS/NYS-MAIN', '', 211, 'AAZ.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 253,
            rowKey: 'AAZ.AS',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ NL', 'GBX', 'AAZ.AS B.V', 'XAMS/ENA-MAIN', '', 784, 'AAZ.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 254,
            rowKey: 'AAZ.OE',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ OE', 'EUR', 'AAZ.OE Co.', 'XNYS/NYS-MAIN', '', 793, 'AAZ.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 255,
            rowKey: 'AAZ.MI',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ MI', 'GBX', 'AAZ.MI Co.', 'XNYS/NYS-MAIN', '', 950, 'AAZ.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 256,
            rowKey: 'AAZ.A',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ A', 'GBX', 'AAZ.A Co.', 'XNYS/NYS-MAIN', '', 691, 'AAZ.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 257,
            rowKey: 'AAZ.PA',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ PA', 'CAD', 'AAZ.PA Co.', 'XNYS/NYS-MAIN', '', 0, 'AAZ.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 258,
            rowKey: 'AAZ.MC',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ MC', 'GBX', 'AAZ.MC Co.', 'XNYS/NYS-MAIN', '', 648, 'AAZ.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 259,
            rowKey: 'AAZ.DE',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['AAZ DE', 'EUR', 'AAZ.DE Co.', 'XNYS/NYS-MAIN', '', 263, 'AAZ.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 260,
            rowKey: 'ABA.L',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA LN', 'GBX', 'ABA.L London PLC', 'XLON/LSE-SETS', '', 86, 'ABA.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 261,
            rowKey: 'ABA.N',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA US', 'USD', 'ABA.N Corporation', 'XNGS/NAS-GSM', '', 498, 'ABA.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 262,
            rowKey: 'ABA.OQ',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA OQ', 'USD', 'ABA.OQ Co.', 'XNYS/NYS-MAIN', '', 214, 'ABA.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 263,
            rowKey: 'ABA.AS',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA NL', 'USD', 'ABA.AS B.V', 'XAMS/ENA-MAIN', '', 443, 'ABA.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 264,
            rowKey: 'ABA.OE',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA OE', 'CAD', 'ABA.OE Co.', 'XNYS/NYS-MAIN', '', 728, 'ABA.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 265,
            rowKey: 'ABA.MI',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA MI', 'GBX', 'ABA.MI Co.', 'XNYS/NYS-MAIN', '', 958, 'ABA.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 266,
            rowKey: 'ABA.A',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA A', 'EUR', 'ABA.A Co.', 'XNYS/NYS-MAIN', '', 811, 'ABA.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 267,
            rowKey: 'ABA.PA',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA PA', 'EUR', 'ABA.PA Co.', 'XNYS/NYS-MAIN', '', 127, 'ABA.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 268,
            rowKey: 'ABA.MC',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA MC', 'EUR', 'ABA.MC Co.', 'XNYS/NYS-MAIN', '', 493, 'ABA.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 269,
            rowKey: 'ABA.DE',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABA DE', 'EUR', 'ABA.DE Co.', 'XNYS/NYS-MAIN', '', 719, 'ABA.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 270,
            rowKey: 'ABB.L',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB LN', 'USD', 'ABB.L London PLC', 'XLON/LSE-SETS', '', 284, 'ABB.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 271,
            rowKey: 'ABB.N',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB US', 'USD', 'ABB.N Corporation', 'XNGS/NAS-GSM', '', 419, 'ABB.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 272,
            rowKey: 'ABB.OQ',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB OQ', 'CAD', 'ABB.OQ Co.', 'XNYS/NYS-MAIN', '', 183, 'ABB.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 273,
            rowKey: 'ABB.AS',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB NL', 'USD', 'ABB.AS B.V', 'XAMS/ENA-MAIN', '', 769, 'ABB.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 274,
            rowKey: 'ABB.OE',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB OE', 'CAD', 'ABB.OE Co.', 'XNYS/NYS-MAIN', '', 996, 'ABB.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 275,
            rowKey: 'ABB.MI',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB MI', 'USD', 'ABB.MI Co.', 'XNYS/NYS-MAIN', '', 239, 'ABB.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 276,
            rowKey: 'ABB.A',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB A', 'CAD', 'ABB.A Co.', 'XNYS/NYS-MAIN', '', 910, 'ABB.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 277,
            rowKey: 'ABB.PA',
            updateType: 'U',
            ts: 1617780603975,
            sel: 0,
            data: ['ABB PA', 'EUR', 'ABB.PA Co.', 'XNYS/NYS-MAIN', '', 82, 'ABB.PA']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 199, hi: 234 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 204, hi: 239 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 208, hi: 243 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 211, hi: 246 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 213, hi: 248 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 214, hi: 249 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 218, hi: 253 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 224, hi: 259 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 227, hi: 262 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 237, hi: 272 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '47',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 174,
        to: 309
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: '48',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 177,
        to: 312
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: '49',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 187,
        to: 322
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '447d4685-2d60-49e1-a3c2-c3fe6ef6b382',
        isLast: true,
        timeStamp: 1617780604382,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 278,
            rowKey: 'ABB.MC',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABB MC', 'CAD', 'ABB.MC Co.', 'XNYS/NYS-MAIN', '', 906, 'ABB.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 279,
            rowKey: 'ABB.DE',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABB DE', 'GBX', 'ABB.DE Co.', 'XNYS/NYS-MAIN', '', 536, 'ABB.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 280,
            rowKey: 'ABC.L',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC LN', 'USD', 'ABC.L London PLC', 'XLON/LSE-SETS', '', 206, 'ABC.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 281,
            rowKey: 'ABC.N',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC US', 'EUR', 'ABC.N Corporation', 'XNGS/NAS-GSM', '', 362, 'ABC.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 282,
            rowKey: 'ABC.OQ',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC OQ', 'CAD', 'ABC.OQ Co.', 'XNYS/NYS-MAIN', '', 895, 'ABC.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 283,
            rowKey: 'ABC.AS',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC NL', 'EUR', 'ABC.AS B.V', 'XAMS/ENA-MAIN', '', 282, 'ABC.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 284,
            rowKey: 'ABC.OE',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC OE', 'CAD', 'ABC.OE Co.', 'XNYS/NYS-MAIN', '', 942, 'ABC.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 285,
            rowKey: 'ABC.MI',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC MI', 'CAD', 'ABC.MI Co.', 'XNYS/NYS-MAIN', '', 733, 'ABC.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 286,
            rowKey: 'ABC.A',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC A', 'CAD', 'ABC.A Co.', 'XNYS/NYS-MAIN', '', 639, 'ABC.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 287,
            rowKey: 'ABC.PA',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC PA', 'GBX', 'ABC.PA Co.', 'XNYS/NYS-MAIN', '', 452, 'ABC.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 288,
            rowKey: 'ABC.MC',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC MC', 'USD', 'ABC.MC Co.', 'XNYS/NYS-MAIN', '', 125, 'ABC.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 289,
            rowKey: 'ABC.DE',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABC DE', 'EUR', 'ABC.DE Co.', 'XNYS/NYS-MAIN', '', 709, 'ABC.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 290,
            rowKey: 'ABD.L',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD LN', 'EUR', 'ABD.L London PLC', 'XLON/LSE-SETS', '', 661, 'ABD.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 291,
            rowKey: 'ABD.N',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD US', 'GBX', 'ABD.N Corporation', 'XNGS/NAS-GSM', '', 233, 'ABD.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 292,
            rowKey: 'ABD.OQ',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD OQ', 'GBX', 'ABD.OQ Co.', 'XNYS/NYS-MAIN', '', 661, 'ABD.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 293,
            rowKey: 'ABD.AS',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD NL', 'EUR', 'ABD.AS B.V', 'XAMS/ENA-MAIN', '', 922, 'ABD.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 294,
            rowKey: 'ABD.OE',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD OE', 'EUR', 'ABD.OE Co.', 'XNYS/NYS-MAIN', '', 745, 'ABD.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 295,
            rowKey: 'ABD.MI',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD MI', 'EUR', 'ABD.MI Co.', 'XNYS/NYS-MAIN', '', 155, 'ABD.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 296,
            rowKey: 'ABD.A',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD A', 'GBX', 'ABD.A Co.', 'XNYS/NYS-MAIN', '', 954, 'ABD.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 297,
            rowKey: 'ABD.PA',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD PA', 'GBX', 'ABD.PA Co.', 'XNYS/NYS-MAIN', '', 44, 'ABD.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 298,
            rowKey: 'ABD.MC',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD MC', 'GBX', 'ABD.MC Co.', 'XNYS/NYS-MAIN', '', 51, 'ABD.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 299,
            rowKey: 'ABD.DE',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABD DE', 'USD', 'ABD.DE Co.', 'XNYS/NYS-MAIN', '', 312, 'ABD.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 300,
            rowKey: 'ABE.L',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE LN', 'USD', 'ABE.L London PLC', 'XLON/LSE-SETS', '', 650, 'ABE.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 301,
            rowKey: 'ABE.N',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE US', 'EUR', 'ABE.N Corporation', 'XNGS/NAS-GSM', '', 316, 'ABE.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 302,
            rowKey: 'ABE.OQ',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE OQ', 'CAD', 'ABE.OQ Co.', 'XNYS/NYS-MAIN', '', 910, 'ABE.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 303,
            rowKey: 'ABE.AS',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE NL', 'EUR', 'ABE.AS B.V', 'XAMS/ENA-MAIN', '', 551, 'ABE.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 304,
            rowKey: 'ABE.OE',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE OE', 'CAD', 'ABE.OE Co.', 'XNYS/NYS-MAIN', '', 587, 'ABE.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 305,
            rowKey: 'ABE.MI',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE MI', 'EUR', 'ABE.MI Co.', 'XNYS/NYS-MAIN', '', 65, 'ABE.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 306,
            rowKey: 'ABE.A',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE A', 'CAD', 'ABE.A Co.', 'XNYS/NYS-MAIN', '', 848, 'ABE.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 307,
            rowKey: 'ABE.PA',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE PA', 'EUR', 'ABE.PA Co.', 'XNYS/NYS-MAIN', '', 785, 'ABE.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 308,
            rowKey: 'ABE.MC',
            updateType: 'U',
            ts: 1617780604382,
            sel: 0,
            data: ['ABE MC', 'USD', 'ABE.MC Co.', 'XNYS/NYS-MAIN', '', 121, 'ABE.MC']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '3f9f4245-8b77-4375-8c91-c64eb5053987',
        isLast: true,
        timeStamp: 1617780604396,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 309,
            rowKey: 'ABE.DE',
            updateType: 'U',
            ts: 1617780604396,
            sel: 0,
            data: ['ABE DE', 'USD', 'ABE.DE Co.', 'XNYS/NYS-MAIN', '', 135, 'ABE.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 310,
            rowKey: 'ABF.L',
            updateType: 'U',
            ts: 1617780604396,
            sel: 0,
            data: ['ABF LN', 'EUR', 'ABF.L London PLC', 'XLON/LSE-SETS', '', 798, 'ABF.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 311,
            rowKey: 'ABF.N',
            updateType: 'U',
            ts: 1617780604396,
            sel: 0,
            data: ['ABF US', 'CAD', 'ABF.N Corporation', 'XNGS/NAS-GSM', '', 42, 'ABF.N']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '3269a7b3-611b-4080-8003-4a2dcc313bb2',
        isLast: true,
        timeStamp: 1617780604414,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 312,
            rowKey: 'ABF.OQ',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF OQ', 'CAD', 'ABF.OQ Co.', 'XNYS/NYS-MAIN', '', 855, 'ABF.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 313,
            rowKey: 'ABF.AS',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF NL', 'EUR', 'ABF.AS B.V', 'XAMS/ENA-MAIN', '', 990, 'ABF.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 314,
            rowKey: 'ABF.OE',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF OE', 'CAD', 'ABF.OE Co.', 'XNYS/NYS-MAIN', '', 906, 'ABF.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 315,
            rowKey: 'ABF.MI',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF MI', 'USD', 'ABF.MI Co.', 'XNYS/NYS-MAIN', '', 142, 'ABF.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 316,
            rowKey: 'ABF.A',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF A', 'GBX', 'ABF.A Co.', 'XNYS/NYS-MAIN', '', 315, 'ABF.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 317,
            rowKey: 'ABF.PA',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF PA', 'USD', 'ABF.PA Co.', 'XNYS/NYS-MAIN', '', 211, 'ABF.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 318,
            rowKey: 'ABF.MC',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF MC', 'USD', 'ABF.MC Co.', 'XNYS/NYS-MAIN', '', 742, 'ABF.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 319,
            rowKey: 'ABF.DE',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABF DE', 'USD', 'ABF.DE Co.', 'XNYS/NYS-MAIN', '', 910, 'ABF.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 320,
            rowKey: 'ABG.L',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABG LN', 'CAD', 'ABG.L London PLC', 'XLON/LSE-SETS', '', 828, 'ABG.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 321,
            rowKey: 'ABG.N',
            updateType: 'U',
            ts: 1617780604414,
            sel: 0,
            data: ['ABG US', 'GBX', 'ABG.N Corporation', 'XNGS/NAS-GSM', '', 360, 'ABG.N']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 247, hi: 282 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 272, hi: 307 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '51',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 222,
        to: 357
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '9279d815-9e3d-4831-88f4-19cab5b01793',
        isLast: true,
        timeStamp: 1617780604482,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 322,
            rowKey: 'ABG.OQ',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG OQ', 'EUR', 'ABG.OQ Co.', 'XNYS/NYS-MAIN', '', 256, 'ABG.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 323,
            rowKey: 'ABG.AS',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG NL', 'USD', 'ABG.AS B.V', 'XAMS/ENA-MAIN', '', 779, 'ABG.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 324,
            rowKey: 'ABG.OE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG OE', 'CAD', 'ABG.OE Co.', 'XNYS/NYS-MAIN', '', 661, 'ABG.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 325,
            rowKey: 'ABG.MI',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG MI', 'CAD', 'ABG.MI Co.', 'XNYS/NYS-MAIN', '', 563, 'ABG.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 326,
            rowKey: 'ABG.A',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG A', 'GBX', 'ABG.A Co.', 'XNYS/NYS-MAIN', '', 926, 'ABG.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 327,
            rowKey: 'ABG.PA',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG PA', 'USD', 'ABG.PA Co.', 'XNYS/NYS-MAIN', '', 775, 'ABG.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 328,
            rowKey: 'ABG.MC',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG MC', 'EUR', 'ABG.MC Co.', 'XNYS/NYS-MAIN', '', 857, 'ABG.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 329,
            rowKey: 'ABG.DE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABG DE', 'CAD', 'ABG.DE Co.', 'XNYS/NYS-MAIN', '', 519, 'ABG.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 330,
            rowKey: 'ABH.L',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH LN', 'EUR', 'ABH.L London PLC', 'XLON/LSE-SETS', '', 401, 'ABH.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 331,
            rowKey: 'ABH.N',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH US', 'GBX', 'ABH.N Corporation', 'XNGS/NAS-GSM', '', 153, 'ABH.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 332,
            rowKey: 'ABH.OQ',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH OQ', 'GBX', 'ABH.OQ Co.', 'XNYS/NYS-MAIN', '', 190, 'ABH.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 333,
            rowKey: 'ABH.AS',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH NL', 'EUR', 'ABH.AS B.V', 'XAMS/ENA-MAIN', '', 283, 'ABH.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 334,
            rowKey: 'ABH.OE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH OE', 'CAD', 'ABH.OE Co.', 'XNYS/NYS-MAIN', '', 875, 'ABH.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 335,
            rowKey: 'ABH.MI',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH MI', 'CAD', 'ABH.MI Co.', 'XNYS/NYS-MAIN', '', 343, 'ABH.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 336,
            rowKey: 'ABH.A',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH A', 'GBX', 'ABH.A Co.', 'XNYS/NYS-MAIN', '', 428, 'ABH.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 337,
            rowKey: 'ABH.PA',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH PA', 'EUR', 'ABH.PA Co.', 'XNYS/NYS-MAIN', '', 510, 'ABH.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 338,
            rowKey: 'ABH.MC',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH MC', 'GBX', 'ABH.MC Co.', 'XNYS/NYS-MAIN', '', 106, 'ABH.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 339,
            rowKey: 'ABH.DE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABH DE', 'USD', 'ABH.DE Co.', 'XNYS/NYS-MAIN', '', 386, 'ABH.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 340,
            rowKey: 'ABI.L',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI LN', 'GBX', 'ABI.L London PLC', 'XLON/LSE-SETS', '', 253, 'ABI.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 341,
            rowKey: 'ABI.N',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI US', 'GBX', 'ABI.N Corporation', 'XNGS/NAS-GSM', '', 85, 'ABI.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 342,
            rowKey: 'ABI.OQ',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI OQ', 'USD', 'ABI.OQ Co.', 'XNYS/NYS-MAIN', '', 141, 'ABI.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 343,
            rowKey: 'ABI.AS',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI NL', 'GBX', 'ABI.AS B.V', 'XAMS/ENA-MAIN', '', 543, 'ABI.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 344,
            rowKey: 'ABI.OE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI OE', 'EUR', 'ABI.OE Co.', 'XNYS/NYS-MAIN', '', 628, 'ABI.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 345,
            rowKey: 'ABI.MI',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI MI', 'CAD', 'ABI.MI Co.', 'XNYS/NYS-MAIN', '', 408, 'ABI.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 346,
            rowKey: 'ABI.A',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI A', 'USD', 'ABI.A Co.', 'XNYS/NYS-MAIN', '', 243, 'ABI.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 347,
            rowKey: 'ABI.PA',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI PA', 'CAD', 'ABI.PA Co.', 'XNYS/NYS-MAIN', '', 91, 'ABI.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 348,
            rowKey: 'ABI.MC',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI MC', 'CAD', 'ABI.MC Co.', 'XNYS/NYS-MAIN', '', 728, 'ABI.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 349,
            rowKey: 'ABI.DE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABI DE', 'EUR', 'ABI.DE Co.', 'XNYS/NYS-MAIN', '', 202, 'ABI.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 350,
            rowKey: 'ABJ.L',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ LN', 'EUR', 'ABJ.L London PLC', 'XLON/LSE-SETS', '', 233, 'ABJ.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 351,
            rowKey: 'ABJ.N',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ US', 'EUR', 'ABJ.N Corporation', 'XNGS/NAS-GSM', '', 524, 'ABJ.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 352,
            rowKey: 'ABJ.OQ',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ OQ', 'EUR', 'ABJ.OQ Co.', 'XNYS/NYS-MAIN', '', 400, 'ABJ.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 353,
            rowKey: 'ABJ.AS',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ NL', 'EUR', 'ABJ.AS B.V', 'XAMS/ENA-MAIN', '', 136, 'ABJ.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 354,
            rowKey: 'ABJ.OE',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ OE', 'EUR', 'ABJ.OE Co.', 'XNYS/NYS-MAIN', '', 434, 'ABJ.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 355,
            rowKey: 'ABJ.MI',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ MI', 'EUR', 'ABJ.MI Co.', 'XNYS/NYS-MAIN', '', 396, 'ABJ.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 356,
            rowKey: 'ABJ.A',
            updateType: 'U',
            ts: 1617780604482,
            sel: 0,
            data: ['ABJ A', 'GBX', 'ABJ.A Co.', 'XNYS/NYS-MAIN', '', 741, 'ABJ.A']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 279, hi: 314 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 284, hi: 319 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 296, hi: 331 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 301, hi: 336 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '55',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 251,
        to: 386
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: 'b9717a64-0285-469d-8cff-a47283254890',
        isLast: true,
        timeStamp: 1617780604718,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 357,
            rowKey: 'ABJ.PA',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABJ PA', 'CAD', 'ABJ.PA Co.', 'XNYS/NYS-MAIN', '', 759, 'ABJ.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 358,
            rowKey: 'ABJ.MC',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABJ MC', 'USD', 'ABJ.MC Co.', 'XNYS/NYS-MAIN', '', 574, 'ABJ.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 359,
            rowKey: 'ABJ.DE',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABJ DE', 'GBX', 'ABJ.DE Co.', 'XNYS/NYS-MAIN', '', 855, 'ABJ.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 360,
            rowKey: 'ABK.L',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK LN', 'CAD', 'ABK.L London PLC', 'XLON/LSE-SETS', '', 221, 'ABK.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 361,
            rowKey: 'ABK.N',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK US', 'GBX', 'ABK.N Corporation', 'XNGS/NAS-GSM', '', 783, 'ABK.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 362,
            rowKey: 'ABK.OQ',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK OQ', 'CAD', 'ABK.OQ Co.', 'XNYS/NYS-MAIN', '', 789, 'ABK.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 363,
            rowKey: 'ABK.AS',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK NL', 'USD', 'ABK.AS B.V', 'XAMS/ENA-MAIN', '', 785, 'ABK.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 364,
            rowKey: 'ABK.OE',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK OE', 'GBX', 'ABK.OE Co.', 'XNYS/NYS-MAIN', '', 404, 'ABK.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 365,
            rowKey: 'ABK.MI',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK MI', 'USD', 'ABK.MI Co.', 'XNYS/NYS-MAIN', '', 684, 'ABK.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 366,
            rowKey: 'ABK.A',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK A', 'EUR', 'ABK.A Co.', 'XNYS/NYS-MAIN', '', 51, 'ABK.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 367,
            rowKey: 'ABK.PA',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK PA', 'CAD', 'ABK.PA Co.', 'XNYS/NYS-MAIN', '', 154, 'ABK.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 368,
            rowKey: 'ABK.MC',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK MC', 'EUR', 'ABK.MC Co.', 'XNYS/NYS-MAIN', '', 386, 'ABK.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 369,
            rowKey: 'ABK.DE',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABK DE', 'CAD', 'ABK.DE Co.', 'XNYS/NYS-MAIN', '', 65, 'ABK.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 370,
            rowKey: 'ABL.L',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL LN', 'CAD', 'ABL.L London PLC', 'XLON/LSE-SETS', '', 4, 'ABL.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 371,
            rowKey: 'ABL.N',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL US', 'GBX', 'ABL.N Corporation', 'XNGS/NAS-GSM', '', 772, 'ABL.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 372,
            rowKey: 'ABL.OQ',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL OQ', 'CAD', 'ABL.OQ Co.', 'XNYS/NYS-MAIN', '', 202, 'ABL.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 373,
            rowKey: 'ABL.AS',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL NL', 'GBX', 'ABL.AS B.V', 'XAMS/ENA-MAIN', '', 621, 'ABL.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 374,
            rowKey: 'ABL.OE',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL OE', 'GBX', 'ABL.OE Co.', 'XNYS/NYS-MAIN', '', 526, 'ABL.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 375,
            rowKey: 'ABL.MI',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL MI', 'GBX', 'ABL.MI Co.', 'XNYS/NYS-MAIN', '', 537, 'ABL.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 376,
            rowKey: 'ABL.A',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL A', 'USD', 'ABL.A Co.', 'XNYS/NYS-MAIN', '', 158, 'ABL.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 377,
            rowKey: 'ABL.PA',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL PA', 'CAD', 'ABL.PA Co.', 'XNYS/NYS-MAIN', '', 463, 'ABL.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 378,
            rowKey: 'ABL.MC',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL MC', 'EUR', 'ABL.MC Co.', 'XNYS/NYS-MAIN', '', 803, 'ABL.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 379,
            rowKey: 'ABL.DE',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABL DE', 'CAD', 'ABL.DE Co.', 'XNYS/NYS-MAIN', '', 903, 'ABL.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 380,
            rowKey: 'ABM.L',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABM LN', 'GBX', 'ABM.L London PLC', 'XLON/LSE-SETS', '', 414, 'ABM.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 381,
            rowKey: 'ABM.N',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABM US', 'GBX', 'ABM.N Corporation', 'XNGS/NAS-GSM', '', 588, 'ABM.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 382,
            rowKey: 'ABM.OQ',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABM OQ', 'EUR', 'ABM.OQ Co.', 'XNYS/NYS-MAIN', '', 182, 'ABM.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 383,
            rowKey: 'ABM.AS',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABM NL', 'GBX', 'ABM.AS B.V', 'XAMS/ENA-MAIN', '', 965, 'ABM.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 384,
            rowKey: 'ABM.OE',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABM OE', 'GBX', 'ABM.OE Co.', 'XNYS/NYS-MAIN', '', 920, 'ABM.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 385,
            rowKey: 'ABM.MI',
            updateType: 'U',
            ts: 1617780604718,
            sel: 0,
            data: ['ABM MI', 'EUR', 'ABM.MI Co.', 'XNYS/NYS-MAIN', '', 629, 'ABM.MI']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 304, hi: 339 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 312, hi: 347 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 322, hi: 357 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 331, hi: 366 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '59',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 281,
        to: 416
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: 'a0babe62-2cae-4517-9baa-cbcc23d45b54',
        isLast: true,
        timeStamp: 1617780604845,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 386,
            rowKey: 'ABM.A',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABM A', 'GBX', 'ABM.A Co.', 'XNYS/NYS-MAIN', '', 491, 'ABM.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 387,
            rowKey: 'ABM.PA',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABM PA', 'CAD', 'ABM.PA Co.', 'XNYS/NYS-MAIN', '', 357, 'ABM.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 388,
            rowKey: 'ABM.MC',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABM MC', 'USD', 'ABM.MC Co.', 'XNYS/NYS-MAIN', '', 198, 'ABM.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 389,
            rowKey: 'ABM.DE',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABM DE', 'USD', 'ABM.DE Co.', 'XNYS/NYS-MAIN', '', 547, 'ABM.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 390,
            rowKey: 'ABN.L',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN LN', 'EUR', 'ABN.L London PLC', 'XLON/LSE-SETS', '', 177, 'ABN.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 391,
            rowKey: 'ABN.N',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN US', 'EUR', 'ABN.N Corporation', 'XNGS/NAS-GSM', '', 626, 'ABN.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 392,
            rowKey: 'ABN.OQ',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN OQ', 'EUR', 'ABN.OQ Co.', 'XNYS/NYS-MAIN', '', 125, 'ABN.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 393,
            rowKey: 'ABN.AS',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN NL', 'USD', 'ABN.AS B.V', 'XAMS/ENA-MAIN', '', 893, 'ABN.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 394,
            rowKey: 'ABN.OE',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN OE', 'GBX', 'ABN.OE Co.', 'XNYS/NYS-MAIN', '', 809, 'ABN.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 395,
            rowKey: 'ABN.MI',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN MI', 'GBX', 'ABN.MI Co.', 'XNYS/NYS-MAIN', '', 49, 'ABN.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 396,
            rowKey: 'ABN.A',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN A', 'CAD', 'ABN.A Co.', 'XNYS/NYS-MAIN', '', 250, 'ABN.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 397,
            rowKey: 'ABN.PA',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN PA', 'EUR', 'ABN.PA Co.', 'XNYS/NYS-MAIN', '', 238, 'ABN.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 398,
            rowKey: 'ABN.MC',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN MC', 'EUR', 'ABN.MC Co.', 'XNYS/NYS-MAIN', '', 197, 'ABN.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 399,
            rowKey: 'ABN.DE',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABN DE', 'CAD', 'ABN.DE Co.', 'XNYS/NYS-MAIN', '', 233, 'ABN.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 400,
            rowKey: 'ABO.L',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO LN', 'USD', 'ABO.L London PLC', 'XLON/LSE-SETS', '', 468, 'ABO.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 401,
            rowKey: 'ABO.N',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO US', 'CAD', 'ABO.N Corporation', 'XNGS/NAS-GSM', '', 505, 'ABO.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 402,
            rowKey: 'ABO.OQ',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO OQ', 'CAD', 'ABO.OQ Co.', 'XNYS/NYS-MAIN', '', 932, 'ABO.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 403,
            rowKey: 'ABO.AS',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO NL', 'USD', 'ABO.AS B.V', 'XAMS/ENA-MAIN', '', 180, 'ABO.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 404,
            rowKey: 'ABO.OE',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO OE', 'CAD', 'ABO.OE Co.', 'XNYS/NYS-MAIN', '', 607, 'ABO.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 405,
            rowKey: 'ABO.MI',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO MI', 'CAD', 'ABO.MI Co.', 'XNYS/NYS-MAIN', '', 478, 'ABO.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 406,
            rowKey: 'ABO.A',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO A', 'EUR', 'ABO.A Co.', 'XNYS/NYS-MAIN', '', 546, 'ABO.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 407,
            rowKey: 'ABO.PA',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO PA', 'EUR', 'ABO.PA Co.', 'XNYS/NYS-MAIN', '', 430, 'ABO.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 408,
            rowKey: 'ABO.MC',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO MC', 'CAD', 'ABO.MC Co.', 'XNYS/NYS-MAIN', '', 485, 'ABO.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 409,
            rowKey: 'ABO.DE',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABO DE', 'EUR', 'ABO.DE Co.', 'XNYS/NYS-MAIN', '', 412, 'ABO.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 410,
            rowKey: 'ABP.L',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABP LN', 'GBX', 'ABP.L London PLC', 'XLON/LSE-SETS', '', 802, 'ABP.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 411,
            rowKey: 'ABP.N',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABP US', 'CAD', 'ABP.N Corporation', 'XNGS/NAS-GSM', '', 610, 'ABP.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 412,
            rowKey: 'ABP.OQ',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABP OQ', 'CAD', 'ABP.OQ Co.', 'XNYS/NYS-MAIN', '', 220, 'ABP.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 413,
            rowKey: 'ABP.AS',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABP NL', 'EUR', 'ABP.AS B.V', 'XAMS/ENA-MAIN', '', 831, 'ABP.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 414,
            rowKey: 'ABP.OE',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABP OE', 'GBX', 'ABP.OE Co.', 'XNYS/NYS-MAIN', '', 782, 'ABP.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 415,
            rowKey: 'ABP.MI',
            updateType: 'U',
            ts: 1617780604845,
            sel: 0,
            data: ['ABP MI', 'GBX', 'ABP.MI Co.', 'XNYS/NYS-MAIN', '', 730, 'ABP.MI']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 339, hi: 374 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 347, hi: 382 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 354, hi: 389 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 360, hi: 395 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '63',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 310,
        to: 445
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: '20b9d227-886d-42cf-9e6b-331807cf5edb',
        isLast: true,
        timeStamp: 1617780604976,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 416,
            rowKey: 'ABP.A',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABP A', 'USD', 'ABP.A Co.', 'XNYS/NYS-MAIN', '', 764, 'ABP.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 417,
            rowKey: 'ABP.PA',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABP PA', 'EUR', 'ABP.PA Co.', 'XNYS/NYS-MAIN', '', 289, 'ABP.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 418,
            rowKey: 'ABP.MC',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABP MC', 'GBX', 'ABP.MC Co.', 'XNYS/NYS-MAIN', '', 386, 'ABP.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 419,
            rowKey: 'ABP.DE',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABP DE', 'GBX', 'ABP.DE Co.', 'XNYS/NYS-MAIN', '', 941, 'ABP.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 420,
            rowKey: 'ABQ.L',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ LN', 'USD', 'ABQ.L London PLC', 'XLON/LSE-SETS', '', 632, 'ABQ.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 421,
            rowKey: 'ABQ.N',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ US', 'CAD', 'ABQ.N Corporation', 'XNGS/NAS-GSM', '', 530, 'ABQ.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 422,
            rowKey: 'ABQ.OQ',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ OQ', 'GBX', 'ABQ.OQ Co.', 'XNYS/NYS-MAIN', '', 654, 'ABQ.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 423,
            rowKey: 'ABQ.AS',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ NL', 'GBX', 'ABQ.AS B.V', 'XAMS/ENA-MAIN', '', 464, 'ABQ.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 424,
            rowKey: 'ABQ.OE',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ OE', 'EUR', 'ABQ.OE Co.', 'XNYS/NYS-MAIN', '', 50, 'ABQ.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 425,
            rowKey: 'ABQ.MI',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ MI', 'EUR', 'ABQ.MI Co.', 'XNYS/NYS-MAIN', '', 529, 'ABQ.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 426,
            rowKey: 'ABQ.A',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ A', 'CAD', 'ABQ.A Co.', 'XNYS/NYS-MAIN', '', 19, 'ABQ.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 427,
            rowKey: 'ABQ.PA',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ PA', 'EUR', 'ABQ.PA Co.', 'XNYS/NYS-MAIN', '', 944, 'ABQ.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 428,
            rowKey: 'ABQ.MC',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ MC', 'GBX', 'ABQ.MC Co.', 'XNYS/NYS-MAIN', '', 424, 'ABQ.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 429,
            rowKey: 'ABQ.DE',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABQ DE', 'CAD', 'ABQ.DE Co.', 'XNYS/NYS-MAIN', '', 938, 'ABQ.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 430,
            rowKey: 'ABR.L',
            updateType: 'U',
            ts: 1617780604975,
            sel: 0,
            data: ['ABR LN', 'GBX', 'ABR.L London PLC', 'XLON/LSE-SETS', '', 234, 'ABR.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 431,
            rowKey: 'ABR.N',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR US', 'EUR', 'ABR.N Corporation', 'XNGS/NAS-GSM', '', 700, 'ABR.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 432,
            rowKey: 'ABR.OQ',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR OQ', 'CAD', 'ABR.OQ Co.', 'XNYS/NYS-MAIN', '', 643, 'ABR.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 433,
            rowKey: 'ABR.AS',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR NL', 'USD', 'ABR.AS B.V', 'XAMS/ENA-MAIN', '', 264, 'ABR.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 434,
            rowKey: 'ABR.OE',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR OE', 'GBX', 'ABR.OE Co.', 'XNYS/NYS-MAIN', '', 626, 'ABR.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 435,
            rowKey: 'ABR.MI',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR MI', 'USD', 'ABR.MI Co.', 'XNYS/NYS-MAIN', '', 525, 'ABR.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 436,
            rowKey: 'ABR.A',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR A', 'USD', 'ABR.A Co.', 'XNYS/NYS-MAIN', '', 853, 'ABR.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 437,
            rowKey: 'ABR.PA',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR PA', 'EUR', 'ABR.PA Co.', 'XNYS/NYS-MAIN', '', 169, 'ABR.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 438,
            rowKey: 'ABR.MC',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR MC', 'CAD', 'ABR.MC Co.', 'XNYS/NYS-MAIN', '', 817, 'ABR.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 439,
            rowKey: 'ABR.DE',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABR DE', 'EUR', 'ABR.DE Co.', 'XNYS/NYS-MAIN', '', 582, 'ABR.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 440,
            rowKey: 'ABS.L',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABS LN', 'CAD', 'ABS.L London PLC', 'XLON/LSE-SETS', '', 32, 'ABS.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 441,
            rowKey: 'ABS.N',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABS US', 'CAD', 'ABS.N Corporation', 'XNGS/NAS-GSM', '', 759, 'ABS.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 442,
            rowKey: 'ABS.OQ',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABS OQ', 'EUR', 'ABS.OQ Co.', 'XNYS/NYS-MAIN', '', 655, 'ABS.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 443,
            rowKey: 'ABS.AS',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABS NL', 'EUR', 'ABS.AS B.V', 'XAMS/ENA-MAIN', '', 70, 'ABS.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 444,
            rowKey: 'ABS.OE',
            updateType: 'U',
            ts: 1617780604976,
            sel: 0,
            data: ['ABS OE', 'CAD', 'ABS.OE Co.', 'XNYS/NYS-MAIN', '', 27, 'ABS.OE']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 365, hi: 400 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 370, hi: 405 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 374, hi: 409 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 377, hi: 412 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 380, hi: 415 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 382, hi: 417 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 384, hi: 419 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 386, hi: 421 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromServer({
      requestId: '71',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '0be5de02-748f-43e9-8779-e246a1635092',
      user: 'user',
      body: {
        type: 'CHANGE_VP_RANGE_SUCCESS',
        viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
        from: 336,
        to: 471
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromServer({
      requestId: 'NA',
      sessionId: '896c2b6e-45a9-482f-83d5-1366dc56e6fe',
      token: '',
      user: 'user',
      body: {
        type: 'TABLE_ROW',
        batch: 'a19a2855-e299-48ec-9136-43c86d3e5e7e',
        isLast: true,
        timeStamp: 1617780605242,
        rows: [
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 445,
            rowKey: 'ABS.MI',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABS MI', 'EUR', 'ABS.MI Co.', 'XNYS/NYS-MAIN', '', 875, 'ABS.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 446,
            rowKey: 'ABS.A',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABS A', 'GBX', 'ABS.A Co.', 'XNYS/NYS-MAIN', '', 952, 'ABS.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 447,
            rowKey: 'ABS.PA',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABS PA', 'USD', 'ABS.PA Co.', 'XNYS/NYS-MAIN', '', 106, 'ABS.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 448,
            rowKey: 'ABS.MC',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABS MC', 'CAD', 'ABS.MC Co.', 'XNYS/NYS-MAIN', '', 686, 'ABS.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 449,
            rowKey: 'ABS.DE',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABS DE', 'GBX', 'ABS.DE Co.', 'XNYS/NYS-MAIN', '', 18, 'ABS.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 450,
            rowKey: 'ABT.L',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT LN', 'USD', 'ABT.L London PLC', 'XLON/LSE-SETS', '', 96, 'ABT.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 451,
            rowKey: 'ABT.N',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT US', 'USD', 'ABT.N Corporation', 'XNGS/NAS-GSM', '', 750, 'ABT.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 452,
            rowKey: 'ABT.OQ',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT OQ', 'CAD', 'ABT.OQ Co.', 'XNYS/NYS-MAIN', '', 410, 'ABT.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 453,
            rowKey: 'ABT.AS',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT NL', 'USD', 'ABT.AS B.V', 'XAMS/ENA-MAIN', '', 169, 'ABT.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 454,
            rowKey: 'ABT.OE',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT OE', 'GBX', 'ABT.OE Co.', 'XNYS/NYS-MAIN', '', 662, 'ABT.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 455,
            rowKey: 'ABT.MI',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT MI', 'CAD', 'ABT.MI Co.', 'XNYS/NYS-MAIN', '', 731, 'ABT.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 456,
            rowKey: 'ABT.A',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT A', 'CAD', 'ABT.A Co.', 'XNYS/NYS-MAIN', '', 243, 'ABT.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 457,
            rowKey: 'ABT.PA',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT PA', 'CAD', 'ABT.PA Co.', 'XNYS/NYS-MAIN', '', 2, 'ABT.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 458,
            rowKey: 'ABT.MC',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT MC', 'USD', 'ABT.MC Co.', 'XNYS/NYS-MAIN', '', 699, 'ABT.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 459,
            rowKey: 'ABT.DE',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABT DE', 'CAD', 'ABT.DE Co.', 'XNYS/NYS-MAIN', '', 591, 'ABT.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 460,
            rowKey: 'ABU.L',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU LN', 'USD', 'ABU.L London PLC', 'XLON/LSE-SETS', '', 112, 'ABU.L']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 461,
            rowKey: 'ABU.N',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU US', 'GBX', 'ABU.N Corporation', 'XNGS/NAS-GSM', '', 927, 'ABU.N']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 462,
            rowKey: 'ABU.OQ',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU OQ', 'CAD', 'ABU.OQ Co.', 'XNYS/NYS-MAIN', '', 258, 'ABU.OQ']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 463,
            rowKey: 'ABU.AS',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU NL', 'EUR', 'ABU.AS B.V', 'XAMS/ENA-MAIN', '', 554, 'ABU.AS']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 464,
            rowKey: 'ABU.OE',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU OE', 'USD', 'ABU.OE Co.', 'XNYS/NYS-MAIN', '', 255, 'ABU.OE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 465,
            rowKey: 'ABU.MI',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU MI', 'EUR', 'ABU.MI Co.', 'XNYS/NYS-MAIN', '', 547, 'ABU.MI']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 466,
            rowKey: 'ABU.A',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU A', 'EUR', 'ABU.A Co.', 'XNYS/NYS-MAIN', '', 671, 'ABU.A']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 467,
            rowKey: 'ABU.PA',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU PA', 'CAD', 'ABU.PA Co.', 'XNYS/NYS-MAIN', '', 93, 'ABU.PA']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 468,
            rowKey: 'ABU.MC',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU MC', 'EUR', 'ABU.MC Co.', 'XNYS/NYS-MAIN', '', 867, 'ABU.MC']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 469,
            rowKey: 'ABU.DE',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABU DE', 'USD', 'ABU.DE Co.', 'XNYS/NYS-MAIN', '', 678, 'ABU.DE']
          },
          {
            viewPortId: 'user-f825ba74-52b4-472e-8016-25a7f6330fd7',
            vpSize: 175760,
            rowIndex: 470,
            rowKey: 'ABV.L',
            updateType: 'U',
            ts: 1617780605242,
            sel: 0,
            data: ['ABV LN', 'GBX', 'ABV.L London PLC', 'XLON/LSE-SETS', '', 634, 'ABV.L']
          }
        ]
      },
      module: 'CORE'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 387, hi: 422 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 388, hi: 423 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 389, hi: 424 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 390, hi: 425 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 391, hi: 426 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 392, hi: 427 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 393, hi: 428 },
      dataType: 'rowData'
    });

    serverProxy.handleMessageFromClient({
      viewport: 'FKwxbagfE7Qf39QluAbtX',
      type: 'setViewRange',
      range: { lo: 394, hi: 429 },
      dataType: 'rowData'
    });

    const viewport = serverProxy.viewports.get('user-f825ba74-52b4-472e-8016-25a7f6330fd7');
    expect(viewport.isTree).toBe(false);
  });
});
