import { messages } from './messages-001';
import { ServerProxy } from '../server-proxy/server-proxy';
console.table(messages.length);
const { requestId: viewport } = messages.find((msg) => msg.body.type === 'CREATE_VP_SUCCESS');

const mockConnection = {
  send: jest.fn()
};

// const callback = jest.fn();
const callback = (message) => {
  console.log(`message posted to client ${message.type}`, message);
};

describe('websocket messages', () => {
  it('loads messages', () => {
    const serverProxy = new ServerProxy(mockConnection, callback);
    const tablename = 'Instruments';
    const noop = () => undefined;

    serverProxy.subscribe({ viewport, tablename, range: { lo: 0, hi: 35 }, bufferSize: 100 }, noop);

    const start = performance.now();
    for (let message of messages) {
      serverProxy.handleMessageFromServer(message);
    }
    const end = performance.now();
    const ms = end - start;
    console.log(
      `took ${ms}ms to process ${messages.length} server messages = ${Math.round(
        (messages.length / ms) * 1000
      )} messages/sec`
    );

    expect(messages).toHaveLength(571);
  });
});
