/**
 * ServerProxy and Viewport (vuu-data-remote), the layer between the Vuu
 * websocket and the UI. Messages go straight into the proxy, with no
 * websocket and no worker; ServerProxyDriver answers server requests at once.
 * Rows have 20 columns and the server table has 10,000 rows. Each viewport
 * shows 50 rows with a buffer of 100 rows either side.
 *
 * Every row a benchmark sends carries a new sequence number, so the proxy
 * never discards a row as unchanged.
 */
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import { bench, describe } from "vitest";
import {
  ServerProxyDriver,
  serverViewportId,
  TABLE_SIZE,
  tableRowMessage,
  vuuRow,
} from "./server-proxy-driver";

const VISIBLE_ROWS = 50;
const MESSAGES = 100;
const options = { time: 1_000, warmupTime: 200 };

const VP1 = serverViewportId(1);

/** Rows from..to of a viewport, all with sequence number seq. */
const rowsFor = (vp: string, from: number, to: number, seq: number) => {
  const rows: VuuRow[] = [];
  for (let i = from; i < to; i++) rows.push(vuuRow(vp, i, seq));
  return rows;
};

/**
 * MESSAGES TABLE_ROW messages of rowsPerMessage visible rows each. Message m
 * updates the next rowsPerMessage rows, wrapping round the visible rows.
 */
const tickMessages = (rowsPerMessage: number, vp = VP1, firstRow = 0) =>
  Array.from({ length: MESSAGES }, (_, m) => {
    const rows: VuuRow[] = [];
    for (let r = 0; r < rowsPerMessage; r++) {
      const rowIndex = firstRow + ((m * rowsPerMessage + r) % VISIBLE_ROWS);
      rows.push(vuuRow(vp, rowIndex, m + 1));
    }
    return tableRowMessage(rows);
  });

const subscribed = async (viewportCount = 1) => {
  const driver = new ServerProxyDriver();
  for (let key = 1; key <= viewportCount; key++) {
    await driver.subscribe(key, { visibleRows: VISIBLE_ROWS });
  }
  return driver;
};

describe("ServerProxy, rows from the server", () => {
  let driver: ServerProxyDriver;

  for (const rowsPerMessage of [1, 10, VISIBLE_ROWS]) {
    const messages = tickMessages(rowsPerMessage);
    bench(
      `${MESSAGES} messages of ${rowsPerMessage} visible row updates`,
      () => {
        for (const message of messages) driver.server(message);
      },
      {
        ...options,
        setup: async () => {
          driver = await subscribed();
        },
      },
    );
  }

  // rows 50..150 are in the buffer: cached, not sent to the client
  const bufferMessages = tickMessages(10, VP1, VISIBLE_ROWS);
  bench(
    `${MESSAGES} messages of 10 buffered (not visible) row updates`,
    () => {
      for (const message of bufferMessages) driver.server(message);
    },
    {
      ...options,
      setup: async () => {
        driver = await subscribed();
      },
    },
  );

  // two versions of the whole cached range, sent alternately
  const fullRange = (order: "in order" | "in reverse order") => {
    const versions = [1, 2].map((seq) => {
      const rows = rowsFor(VP1, 0, 150, seq);
      return tableRowMessage(order === "in order" ? rows : rows.reverse());
    });
    let i = 0;
    bench(
      `one message of 150 rows ${order}`,
      () => {
        driver.server(versions[i++ % 2]);
      },
      {
        ...options,
        setup: async () => {
          driver = await subscribed();
        },
      },
    );
  };
  fullRange("in order");
  fullRange("in reverse order");
});

describe("ServerProxy, rows for 10 viewports", () => {
  const VIEWPORTS = 10;
  let driver: ServerProxyDriver;
  // each message updates 10 visible rows in every viewport, interleaved
  const messages = Array.from({ length: MESSAGES }, (_, m) => {
    const rows: VuuRow[] = [];
    for (let r = 0; r < 10; r++) {
      const rowIndex = (m * 10 + r) % VISIBLE_ROWS;
      for (let key = 1; key <= VIEWPORTS; key++) {
        rows.push(vuuRow(serverViewportId(key), rowIndex, m + 1));
      }
    }
    return tableRowMessage(rows);
  });
  bench(
    `${MESSAGES} messages of 100 rows across ${VIEWPORTS} viewports`,
    () => {
      for (const message of messages) driver.server(message);
    },
    {
      ...options,
      setup: async () => {
        driver = await subscribed(VIEWPORTS);
      },
    },
  );
});

describe("ServerProxy, client range changes", () => {
  let driver: ServerProxyDriver;
  const setup = async () => {
    driver = await subscribed();
  };

  // 1-row steps down to row 200 and back: rows come from the cache until
  // the range nears the edge of the buffer, then the server sends more
  bench(
    "400 one-row scroll steps (down 200 rows, back up 200)",
    () => {
      for (let from = 1; from <= 200; from++) {
        driver.setRange(1, from, from + VISIBLE_ROWS);
      }
      for (let from = 199; from >= 0; from--) {
        driver.setRange(1, from, from + VISIBLE_ROWS);
      }
    },
    { ...options, setup },
  );

  // jumps far enough that nothing is cached; the server sends the new rows
  const jumps = Array.from(
    { length: 20 },
    (_, i) => ((i * 7919) % (TABLE_SIZE / VISIBLE_ROWS)) * VISIBLE_ROWS,
  );
  bench(
    "20 jumps to uncached rows",
    () => {
      for (const from of jumps) {
        driver.setRange(1, from, from + VISIBLE_ROWS);
      }
      driver.setRange(1, 0, VISIBLE_ROWS);
    },
    { ...options, setup },
  );
});
