import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize, resolve } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

/** Minimal static file server for a built benchmark app */
export const serveDirectory = async (directory: string) => {
  const rootDir = resolve(directory);
  await stat(join(rootDir, "index.html")).catch(() => {
    throw Error(
      `[benchmarks] no index.html in ${rootDir}, run npm run bench:build`,
    );
  });

  const server: Server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let filePath = normalize(join(rootDir, urlPath));
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403).end();
      return;
    }
    const info = await stat(filePath).catch(() => undefined);
    if (!info || info.isDirectory()) filePath = join(rootDir, "index.html");
    res.writeHead(200, {
      "content-type":
        CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(res);
  });

  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
};
