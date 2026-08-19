import http from "node:http";
import path from "node:path";
import https from "node:https";
import open from "open";
import handler from "serve-handler";
import { createShowcaseRsbuilds } from "./rsbuild.ts";

const outputDirectory = path.resolve(process.cwd(), ".showcase/prod");
const { host, remote } = await createShowcaseRsbuilds(false, outputDirectory);

await host.build();
await remote.build();

const server = http.createServer((request, response) => {
  if (forwardAuthRequest(request, response)) {
    return;
  }

  return handler(request, response, {
    public: outputDirectory,
    rewrites: [{ destination: "/index.html", source: "**" }],
  });
});

await new Promise<void>((resolve) => server.listen(4173, resolve));
console.log("Running at http://localhost:4173");
await open("http://localhost:4173/");

function forwardAuthRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
) {
  if (!request.url?.startsWith("/api/authn")) {
    return false;
  }

  const target = new URL(request.url, "https://localhost:8443");
  const proxyRequest = https.request(
    {
      headers: { ...request.headers, host: target.host },
      hostname: target.hostname,
      method: request.method,
      path: `${target.pathname}${target.search}`,
      port: target.port ? Number(target.port) : undefined,
      rejectUnauthorized: false,
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on("error", (error) => {
    console.error("Proxy /api/authn failed", error);
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "text/plain" });
    }
    response.end("Bad Gateway");
  });
  request.pipe(proxyRequest);
  return true;
}
