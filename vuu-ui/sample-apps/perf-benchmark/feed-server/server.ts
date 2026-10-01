// Node counterpart to the real VUU server used on the other side of this
// benchmark (example/main/.../BenchmarkMain.scala + BenchmarkTickProvider).
// ag-grid has no server component of its own, so this stands in for one:
// it generates the same two fixed row sets (10k/100k instruments, same
// seeded PRNG - pseudo-random number generator - and tick math as the VUU
// server) and streams updates to the browser over a plain WebSocket (WS),
// so ag-grid's client code is exercised against a comparable networked
// feed rather than an in-process mock.
//
// Serves two connection modes, matched to ag-grid's two row models:
// - "client": ag-grid's normal client-side row model. Full dataset sent
//   once on connect; the browser holds and sorts/filters it itself.
// - "server": ag-grid's Enterprise Server-Side Row Model (SSRM). No upfront
//   dataset - the browser requests row blocks via getRows, and this server
//   does the sorting/filtering/paging, matching how VUU's real server works.
import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { generateInstruments, type InstrumentRow } from "../src/harness/instruments";
import { TickEngine, type BurstResult, type TickStats } from "../src/harness/TickEngine";

const PORT = 4000;

// One persistent dataset + scheduler per row-count tier, created once at
// startup - mirrors BenchmarkPriceModule seeding its two tables once when
// the VUU server starts, rather than per client connection.
interface Feed {
  rows: InstrumentRow[];
  tickEngine: TickEngine;
  connections: Set<WebSocket>;
}

function createFeed(rowCount: number): Feed {
  const rows = generateInstruments(rowCount);
  const connections = new Set<WebSocket>();
  const tickEngine = new TickEngine(rows, (changedRows) => {
    const message = JSON.stringify({ type: "update", rows: changedRows });
    for (const ws of connections) {
      ws.send(message);
    }
  });
  return { rows, tickEngine, connections };
}

const feeds = new Map<number, Feed>([
  [10_000, createFeed(10_000)],
  [100_000, createFeed(100_000)],
]);

// Mirrors ag-grid's IServerSideGetRowsRequest (only the fields this
// benchmark actually uses - no row grouping/pivoting support).
interface SortModelItem {
  colId: string;
  sort: "asc" | "desc";
}
interface FilterModelEntry {
  filterType?: "text" | "number";
  type: "equals" | "greaterThan" | "lessThan";
  filter: string | number;
}
type FilterModel = Record<string, FilterModelEntry>;

function matchesFilter(row: InstrumentRow, filterModel: FilterModel | null | undefined): boolean {
  if (!filterModel) return true;
  return Object.entries(filterModel).every(([colId, def]) => {
    const value = row[colId as keyof InstrumentRow];
    switch (def.type) {
      case "equals":
        return String(value) === String(def.filter);
      case "greaterThan":
        return typeof value === "number" && value > Number(def.filter);
      case "lessThan":
        return typeof value === "number" && value < Number(def.filter);
      default:
        return true;
    }
  });
}

function compareRows(a: InstrumentRow, b: InstrumentRow, sortModel: SortModelItem[]): number {
  for (const { colId, sort } of sortModel) {
    const av = a[colId as keyof InstrumentRow];
    const bv = b[colId as keyof InstrumentRow];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    if (cmp !== 0) return sort === "asc" ? cmp : -cmp;
  }
  return 0;
}

/** Server-side equivalent of what ag-grid's client-side row model does in-browser. */
function getRowsForRequest(
  rows: InstrumentRow[],
  request: {
    startRow?: number;
    endRow?: number;
    sortModel?: SortModelItem[];
    filterModel?: FilterModel | null;
  },
): { rows: InstrumentRow[]; rowCount: number } {
  let result = request.filterModel ? rows.filter((r) => matchesFilter(r, request.filterModel)) : rows;
  if (request.sortModel?.length) {
    result = result.slice().sort((a, b) => compareRows(a, b, request.sortModel!));
  }
  const start = request.startRow ?? 0;
  const end = request.endRow ?? result.length;
  return { rows: result.slice(start, end), rowCount: result.length };
}

type ClientMessage =
  | { type: "startTicking"; updatesPerSecond: number; updatesPerMessage?: number }
  | { type: "stopTicking" }
  | { type: "fireBurst"; requestId: number; totalUpdates: number; updatesPerMessage?: number }
  | { type: "getStreamStats"; requestId: number }
  | { type: "resetStreamStats" }
  | {
      type: "getRows";
      requestId: number;
      startRow?: number;
      endRow?: number;
      sortModel?: SortModelItem[];
      filterModel?: FilterModel | null;
    };

// Plain HTTP endpoint, sharing the same port as the WS server, so the
// Playwright test harness can reset a feed's dataset + tick PRNG back to a
// pristine, freshly-seeded state *before* the page under test connects.
// This has to happen pre-connection rather than via a client-issued message:
// ag-grid-client is sent its full dataset the instant it connects, and
// ag-grid-server's SSRM starts firing getRows as soon as it mounts, so a
// reset issued from the page itself would race those - it might land after
// the client already has (or has requested) pre-reset data. Doing it over
// plain HTTP, awaited from the test before page.goto, removes the race
// entirely: by the time the page can even open a WebSocket, feeds.get(...)
// already returns the new Feed.
const httpServer = createServer((req, res) => {
  const url = new URL(req.url ?? "", `http://localhost:${PORT}`);
  if (req.method === "POST" && url.pathname === "/reset") {
    const rowCount = Number(url.searchParams.get("rows") ?? "10000");
    if (!feeds.has(rowCount)) {
      res.writeHead(400, { "Content-Type": "text/plain" }).end(`no feed for rows=${rowCount}`);
      return;
    }
    feeds.set(rowCount, createFeed(rowCount));
    res.writeHead(204).end();
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ server: httpServer, path: "/feed" });

wss.on("connection", (ws, request) => {
  const url = new URL(request.url ?? "", `http://localhost:${PORT}`);
  const rowCount = Number(url.searchParams.get("rows") ?? "10000");
  const mode = url.searchParams.get("mode") === "server" ? "server" : "client";
  const feed = feeds.get(rowCount);
  if (!feed) {
    ws.close(1008, `no feed for rows=${rowCount}`);
    return;
  }

  feed.connections.add(ws);
  if (mode === "client") {
    // Client-side row model: browser holds everything, so it needs the
    // full dataset upfront. SSRM ("server" mode) never gets this - it only
    // ever sees what it explicitly asks for via getRows.
    ws.send(JSON.stringify({ type: "init", rows: feed.rows }));
  } else {
    ws.send(JSON.stringify({ type: "ready" }));
  }

  ws.on("close", () => {
    feed.connections.delete(ws);
  });

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString()) as ClientMessage;
    switch (message.type) {
      case "startTicking":
        feed.tickEngine.start(message.updatesPerSecond, message.updatesPerMessage);
        break;
      case "stopTicking":
        feed.tickEngine.stop();
        break;
      case "resetStreamStats":
        feed.tickEngine.resetStats();
        break;
      case "getStreamStats": {
        const stats: TickStats = feed.tickEngine.getStats();
        ws.send(JSON.stringify({ type: "streamStats", requestId: message.requestId, ...stats }));
        break;
      }
      case "getRows": {
        const { rows, rowCount: matchedCount } = getRowsForRequest(feed.rows, message);
        ws.send(
          JSON.stringify({
            type: "rowsResult",
            requestId: message.requestId,
            rows,
            rowCount: matchedCount,
          }),
        );
        break;
      }
      case "fireBurst": {
        // TickEngine.fireBurst already calls the tickEngine's applyUpdates
        // callback per batch (same callback start()/stop() use), so every
        // batch is broadcast to connected clients as it's generated - no
        // separate broadcast needed once the burst completes.
        feed.tickEngine
          .fireBurst(message.totalUpdates, message.updatesPerMessage)
          .then((result: BurstResult) => {
            ws.send(
              JSON.stringify({ type: "burstResult", requestId: message.requestId, ...result }),
            );
          });
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[feed-server] listening on ws://localhost:${PORT}/feed (POST /reset?rows=N to reseed)`);
});
