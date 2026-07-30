import { createFolder, formatDuration, writeFile } from "./utils.ts";
import { build } from "./esbuild.ts";
import { buildFileList } from "./build-file-list.ts";
import fs from "fs";
import path from "path";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";
import type { Plugin, PluginBuild, OnLoadArgs } from "esbuild";
import mdx from "@mdx-js/esbuild";
import handler from "serve-handler";
import http from "http";
import https from "https";
import open from "open";
import { fileURLToPath } from "url";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";

type ProxyRoute = {
  url: string;
  remoteUrl: string;
};

const pathToSrc = "./src/examples";

const examples = buildFileList(pathToSrc, /examples.tsx$/);
const mdxFiles = buildFileList(pathToSrc, /.mdx$/);
const features = buildFileList("./src/features", /feature.tsx$/);

// TODO use a separate build call for each theme, without bundling
const themes = ["./src/themes/salt-theme-next.ts", "./src/themes/vuu-theme.ts"];

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const currentDir = path.dirname(__filename); // get the name of the directory
const showcaseIndex = path.join(currentDir, "../src/root.ts");

const outdir = ".showcase/prod";

const proxyRoutes: ProxyRoute[] = [
  { url: "/api/authn", remoteUrl: "https://localhost:8443/api/authn" },
];

const entryPoints = [showcaseIndex]
  .concat(examples)
  .concat(features)
  .concat(mdxFiles)
  .concat(themes);

const cssInlinePlugin: Plugin = {
  name: "CssInline",
  setup(build: PluginBuild) {
    build.onLoad(
      {
        filter:
          /packages\/(vuu|grid)-(chart|context-menu|datatable|filters|layout|popups|shell|table-extras|ui-controls|table)\/.*.css$/,
      },
      async (args: OnLoadArgs) => {
        const css = await fs.promises.readFile(args.path, "utf8");
        // css = await esbuild.transform(css, { loader: "css", minify: true });
        return { loader: "text", contents: css };
      },
    );
  },
};

// 2) Create the .showcase working directory
if (!fs.existsSync(".showcase/prod")) {
  createFolder(".showcase/prod");
}

const esbuildConfig = {
  entryPoints,
  env: "production",
  external: ["./themes/salt-theme-next.ts", "./themes/vuu-theme.ts"],
  name: "showcase",
  plugins: [cssInlinePlugin, mdx()],
  outdir: `${outdir}`,
  splitting: true,
  target: "esnext",
};

async function main() {
  console.log("[CLEAN]");
  // Create the deploy folder
  createFolder(outdir);

  console.log("[BUILD]");
  const [{ duration }] = await Promise.all([build(esbuildConfig)]).catch(
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );

  const [treeSourceJson /*, tags*/] = treeSourceFromFileSystem(
    "./src/examples",
    "production",
  );
  await writeFile(
    `export default ${JSON.stringify(treeSourceJson)};`,
    path.resolve(outdir, "treeSourceJson.js"),
  );

  console.log(`\nbuild took ${formatDuration(duration)}`);

  // 2.3 create index.html
  const HTML_TEMPLATE = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vuu Showcase</title>
    <link rel="stylesheet" href="/tools/vuu-showcase/src/root.css" />
    <script type="module">
      const { default: treeSource } = await import("/treeSourceJson.js");
      const { default: start } = await import(
        "/tools/vuu-showcase/src/root.js"
      );
      start(treeSource);
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
  `;
  await writeFile(HTML_TEMPLATE, "./.showcase/prod/index.html");

  const rootPaths = joinRootPaths(treeSourceJson);
  const routingPattern = `/(${rootPaths})/**`;
  console.log({ routingPattern });

  const server = http.createServer((request, response) => {
    if (forwardProxyRequest(request, response, proxyRoutes)) {
      return;
    }

    // You pass two more arguments for config and middleware
    // More details here:
    return handler(request, response, {
      public: outdir,
      rewrites: [
        {
          source: "/themes/vuu-theme.css",
          destination: "/showcase/src/themes/vuu-theme.css",
        },
        {
          source: routingPattern,
          destination: "index.html",
        },
        {
          source: "/features/FilterTable.feature.css",
          destination: "/showcase/src/features/FilterTable.feature.css",
        },
        {
          source: "/features/FilterTable.feature.js",
          destination: "/showcase/src/features/FilterTable.feature.js",
        },
        {
          source: "/features/BasketTrading.feature.css",
          destination: "/showcase/src/features/BasketTrading.feature.css",
        },
        {
          source: "/features/BasketTrading.feature.js",
          destination: "/showcase/src/features/BasketTrading.feature.js",
        },
      ],
    });
  });

  await server.listen(4173, () => {
    console.log("Running at http://localhost:4173");
  });

  open("http://localhost:4173/");
}

main();

function joinRootPaths(treeNodes: TreeSourceNode[]) {
  return treeNodes.map(({ id }) => id).join("|");
}

function forwardProxyRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  routes: ProxyRoute[],
): boolean {
  const requestUrl = request.url;
  if (!requestUrl) {
    return false;
  }

  const currentUrl = new URL(requestUrl, "http://localhost");
  const matchedRoute = routes.find(({ url }) => currentUrl.pathname.startsWith(url));
  if (!matchedRoute) {
    return false;
  }

  const remote = new URL(matchedRoute.remoteUrl);
  const suffixPath = currentUrl.pathname.slice(matchedRoute.url.length);
  const targetPath = `${joinUrlPaths(remote.pathname, suffixPath)}${currentUrl.search}`;
  const requestModule = remote.protocol === "http:" ? http : https;

  const proxyRequest = requestModule.request(
    {
      protocol: remote.protocol,
      hostname: remote.hostname,
      port: remote.port ? Number(remote.port) : undefined,
      path: targetPath,
      method: request.method,
      headers: {
        ...request.headers,
        host: remote.host,
      },
      // Local auth services often use self-signed certs.
      ...(remote.protocol === "https:" ? { rejectUnauthorized: false } : {}),
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on("error", (error) => {
    console.error(`Proxy ${matchedRoute.url} failed`, error);
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "text/plain" });
    }
    response.end("Bad Gateway");
  });

  request.pipe(proxyRequest);
  return true;
}

function joinUrlPaths(basePath: string, suffixPath: string) {
  if (!suffixPath) {
    return basePath;
  }
  if (basePath.endsWith("/") && suffixPath.startsWith("/")) {
    return `${basePath.slice(0, -1)}${suffixPath}`;
  }
  if (!basePath.endsWith("/") && !suffixPath.startsWith("/")) {
    return `${basePath}/${suffixPath}`;
  }
  return `${basePath}${suffixPath}`;
}
