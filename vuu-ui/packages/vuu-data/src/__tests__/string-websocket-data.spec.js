import { messages } from './messages/messages_001';

const string_messages = messages.map((msg) => JSON.stringify(msg));

const reType = /type":"([A-Z_]+)"/;

describe('websocket messages', () => {
  it('loads messages', () => {
    const startTime = performance.now();

    for (let message of string_messages) {
      const match = reType.exec(message);
      const type = match[1];

      if (type === 'TABLE_ROW') {
        let start = message.indexOf('"rows":[');
        let end = message.lastIndexOf(']');
        const rows = message.substring(start + 8, end).split(',{');
        for (const row of rows) {
          const vpId = row.substring(14, 55);

          start = row.indexOf('rowIndex":');
          end = row.indexOf(',"rowKey', start);
          const rowIndex = parseInt(row.substring(start + 10, end));

          start = row.indexOf('updateType');
          end = row.indexOf('",', start + 13);

          const updateType = row.substring(start + 13, end);
        }
      }
    }
    const endTime = performance.now();
    console.log(`process took ${endTime - startTime} ms`);
    expect(messages).toHaveLength(3);
  });

  it('deserializes messages to JSON', () => {
    const startTime = performance.now();

    for (let message of string_messages) {
      const json = JSON.parse(message);
      const type = json.body.type;

      if (type === 'TABLE_ROW') {
        const rows = json.body.rows;
        for (const row of rows) {
          const { viewPortId, rowIndex, updateType } = row;
        }
      }
    }
    const endTime = performance.now();
    console.log(`process took ${endTime - startTime} ms`);
    expect(messages).toHaveLength(3);
  });
});
