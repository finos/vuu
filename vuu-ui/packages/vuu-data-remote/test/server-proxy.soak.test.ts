import "./global-mocks";
import { describe, it, vi } from "vitest";
import {
  clientRows,
  rows,
  serverProxyHarness,
  size,
  sizeOnly,
  viewportUpdate,
} from "./server-proxy-dsl";

/** inclusive integer range */
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe("Soak testing - drip feed records to the UI, each size ", () => {
  it("1) sends zero count to client when table is initially empty 2) sends each rowcount and row when rows arrive individually, sending a) SIZE record b) data record each time new row added does not wait for full range when all rows are available", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    t.server.sends(size(0));
    t.expectClient(sizeOnly(0));

    for (const i of range(1, 10)) {
      t.server.sends(size(i), rows(i - 1, i, { vpSize: i }));
      t.expectClient(viewportUpdate({ rows: clientRows(i - 1, i), size: i }));
    }
  });

  it("1) sends zero count to client when table is initially empty 2) sends each rowcount and row when rows arrive individually, sending a) data record b) SIZE record each time new row added does not wait for full range when all rows are available", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    t.server.sends(size(0));
    t.expectClient(sizeOnly(0));

    for (const i of range(1, 10)) {
      t.server.sends(rows(i - 1, i, { vpSize: i }), size(i));
      t.expectClient(viewportUpdate({ rows: clientRows(i - 1, i), size: i }));
    }
  });

  it("1) sends size and data rows to client until full client range is satisfied, multiple size rows arrive ahead of data rows", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    t.server.sends(size(0));
    t.discard();

    t.server.sends(rows(0, 1, { vpSize: 1 }), size(1));
    t.expectClient(viewportUpdate({ rows: clientRows(0, 1), size: 1 }));

    // two successive size rows, ahead of data rows
    t.server.sends(size(2), size(3));
    t.expectClient(sizeOnly(3));

    t.server.sends(rows(1, 2, { vpSize: 3 }));
    t.expectClient(viewportUpdate({ rows: clientRows(1, 2) }));

    t.server.sends(rows(2, 3, { vpSize: 3 }));
    t.expectClient(viewportUpdate({ rows: clientRows(2, 3) }));
  });

  it("1) sends size rows beyond client range, then data rows one at a time", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    // Time stands still from here, so size update throttling is not triggered
    vi.useFakeTimers();

    for (const i of range(1, 12)) {
      t.server.sends(size(i));
    }
    t.expectClient(...range(1, 12).map((n) => sizeOnly(n)));

    vi.clearAllTimers();

    for (const i of range(0, 11)) {
      t.server.sends(rows(i - 1, i, { vpSize: 12 }));
    }
    // rows 10 and 11 are outside the client range
    t.expectClient(
      ...range(0, 9).map((i) => viewportUpdate({ rows: clientRows(i, i + 1) })),
    );
  });

  it("1) sends size rows beyond client range, then data rows in two batches", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    for (const i of range(0, 12)) {
      t.server.sends(size(i));
    }
    t.discard();

    t.server.sends(rows(0, 5, { vpSize: 12 }));
    t.expectClient(viewportUpdate({ rows: clientRows(0, 5) }));

    t.server.sends(rows(5, 12, { vpSize: 12 }));
    t.expectClient(viewportUpdate({ rows: clientRows(5, 10) }));
  });

  it("1) sends size rows beyond client range, then data rows in a single batch", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    for (const i of range(0, 12)) {
      t.server.sends(size(i));
    }
    t.discard();

    t.server.sends(rows(0, 12, { vpSize: 12 }));
    t.expectClient(viewportUpdate({ rows: clientRows(0, 10) }));
  });

  it("throttles size only updates, after three messages, 100ms delay kicks in", async () => {
    const t = await serverProxyHarness({ bufferSize: 10 });

    vi.useFakeTimers();
    vi.setSystemTime("2025-01-01T09:00:00.000Z");
    for (const i of range(1, 20)) {
      vi.advanceTimersByTime(1);
      t.server.sends(size(i));
    }
    t.expectClient(sizeOnly(1), sizeOnly(2), sizeOnly(3));

    vi.advanceTimersByTime(100);
    t.expectClient(sizeOnly(20));

    vi.clearAllTimers();
  });
});
