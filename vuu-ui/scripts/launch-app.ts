/**
 * Serves the deployed app-vuu-example (built via `npm run build:app`) using
 * serve-handler, the request handler that powers Vercel's `serve`.
 *
 * Use this when the Vuu server does not itself host the app (e.g. the bun
 * based vuu-websocket vuu-demo server). Requests to /api/* are proxied to the
 * auth server so the browser sees them as same-origin (no CORS required).
 *
 * Usage:
 *   npm run launch:app -- [--authurl <url>] [--wsurl <url>] [--port <port>]
 *
 * e.g. against vuu-websocket vuu-demo (auth served on the websocket port)
 *   npm run launch:app -- --authurl https://localhost:8090
 */
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { parseArgs } from "node:util";
import open from "open";
import handler from "serve-handler";

const { values: args } = parseArgs({
  options: {
    authurl: { type: "string", default: "https://localhost:8443/api" },
    wsurl: { type: "string", default: "wss://localhost:8090/websocket" },
    port: { type: "string", default: "3010" },
  },
});

const validateAuthUrl = (url: string) => {
  if (!url.startsWith("http")) {
    throw Error(`invalid auth url '${url}'`);
  }
  if (url.endsWith("api/")) {
    return url.slice(0, -1);
  } else if (url.endsWith("api")) {
    return url;
  } else if (url.endsWith("/")) {
    return `${url}api`;
  } else {
    return `${url}/api`;
  }
};

const validateWebsocketUrl = (url: string) => {
  if (!url.startsWith("ws")) {
    throw Error(`invalid websocket url '${url}'`);
  }
  return url;
};

const validatePort = (port: string) => {
  if (!/^\d{4,5}$/.test(port)) {
    throw Error(`Invalid port ${port}`);
  }
  return Number(port);
};

const authUrl = new URL(validateAuthUrl(args.authurl));
const wsUrl = validateWebsocketUrl(args.wsurl);
const port = validatePort(args.port);

const DEPLOY_DIR = "./deployed_apps/app-vuu-example";
const configPath = `${DEPLOY_DIR}/config.json`;

if (!fs.existsSync(configPath)) {
  console.error(
    `${configPath} not found, build the app first with 'npm run build:app'`,
  );
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
fs.writeFileSync(
  configPath,
  JSON.stringify({ ...config, websocketUrl: wsUrl }, null, 2),
);

const API_PREFIX = "/api/";

/**
 * Forward /api/<path> to <authUrl>/<path>. Local Vuu servers typically
 * use self-signed certificates, so certificate validation is disabled.
 */
const proxyApiRequest = (
  request: http.IncomingMessage,
  response: http.ServerResponse,
) => {
  const { pathname, search } = new URL(request.url ?? "/", "http://localhost");
  const targetPath = `${authUrl.pathname.replace(/\/$/, "")}/${pathname.slice(API_PREFIX.length)}${search}`;
  const isHttps = authUrl.protocol === "https:";

  const proxyRequest = (isHttps ? https : http).request(
    {
      protocol: authUrl.protocol,
      hostname: authUrl.hostname,
      port: authUrl.port || undefined,
      path: targetPath,
      method: request.method,
      headers: { ...request.headers, host: authUrl.host },
      ...(isHttps ? { rejectUnauthorized: false } : {}),
    },
    (proxyResponse) => {
      console.log(
        `${request.method} ${pathname} -> ${authUrl.origin}${targetPath} ${proxyResponse.statusCode}`,
      );
      response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on("error", (error: NodeJS.ErrnoException) => {
    const reason = error.code ?? error.message;
    console.error(
      `${request.method} ${pathname} -> ${authUrl.origin}${targetPath} failed: ${reason}`,
    );
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "text/plain" });
    }
    response.end(`Bad Gateway: ${reason}`);
  });

  request.pipe(proxyRequest);
};

const server = http.createServer((request, response) => {
  if (request.url?.startsWith(API_PREFIX)) {
    proxyApiRequest(request, response);
  } else {
    handler(request, response, {
      public: DEPLOY_DIR,
      cleanUrls: false,
      rewrites: [
        { source: "/", destination: "/index.html" },
        { source: "/login", destination: "/login.html" },
      ],
      headers: [
        {
          source: "**/config.json",
          headers: [{ key: "Cache-Control", value: "no-cache" }],
        },
      ],
    });
  }
});

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `port ${port} is already in use, specify another with --port`
      : error.message,
  );
  process.exit(1);
});

server.listen(port, () => {
  console.log(`http server running on port ${port}

  auth url : ${authUrl.href}/authn
  websocket: ${wsUrl}
  `);
  open(`http://localhost:${port}/index.html`);
});
