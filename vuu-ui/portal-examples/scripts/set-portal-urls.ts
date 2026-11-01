/**
 * Points the built portal example at a portal Vuu server on configurable
 * ports, without rebuilding.
 *
 * Sets `restUrl` and `websocketUrl` in the built `config.json` of
 * portal-host and module-admin (both connect to the portal Vuu server).
 * Only the parts given are changed; the rest come from the current
 * portal-host `config.json`. Targets that are not built are skipped. Other
 * fields, such as `authUrl` and `connectionId`, are kept. Whatever serves
 * `dist_portal` (e.g. nginx) picks up the change on the next page load.
 *
 * The options given are saved in `portal-examples/.portal-urls.json`
 * (gitignored) and merged with those saved before. A run with no options
 * applies the saved ones, so the portal builds, which overwrite
 * `config.json`, run this afterwards to keep the chosen ports.
 * `npm run portal:serve` runs it first. `--reset` forgets the saved options;
 * rebuild to get the default URLs back.
 *
 * The portal Vuu server itself is started separately, on the same ports.
 *
 * Usage (from vuu-ui, after `npm run build:mf`):
 *   npm run portal:launch -- [--ws-port <port>] [--https-port <port>]
 *     [--ws-path <path>] [--hostname <host>] [--reset]
 *
 * Each option can also be set with an env var: VUU_WEBSOCKET_PORT,
 * VUU_HTTPS_PORT, VUU_WEBSOCKET_PATH, VUU_HOSTNAME.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const vuuUiRoot = path.resolve(import.meta.dirname, "../..");
const settingsPath = path.resolve(import.meta.dirname, "../.portal-urls.json");
const env = process.env;

const { values: args } = parseArgs({
  options: {
    "ws-port": { type: "string", default: env.VUU_WEBSOCKET_PORT },
    "https-port": { type: "string", default: env.VUU_HTTPS_PORT },
    "ws-path": { type: "string", default: env.VUU_WEBSOCKET_PATH },
    hostname: { type: "string", default: env.VUU_HOSTNAME },
    reset: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (args.help) {
  const source = fs.readFileSync(import.meta.filename, "utf8");
  console.log(source.slice(source.indexOf("/**"), source.indexOf("*/") + 2));
  process.exit(0);
}

if (args.reset) {
  fs.rmSync(settingsPath, { force: true });
  console.log("[portal urls] saved options cleared");
  process.exit(0);
}

const validatePort = (name: string, value: string | undefined) => {
  if (value === undefined) return undefined;
  const port = Number(value);
  if (!/^\d+$/.test(value) || port < 1 || port > 65535) {
    throw Error(`--${name}: invalid port '${value}'`);
  }
  return value;
};

interface PortalUrlSettings {
  hostname?: string;
  httpsPort?: string;
  wsPath?: string;
  wsPort?: string;
}

const readSettings = (): PortalUrlSettings => {
  if (!fs.existsSync(settingsPath)) return {};
  const saved: unknown = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  if (typeof saved !== "object" || saved === null) return {};
  const { hostname, httpsPort, wsPath, wsPort } = saved as Record<
    string,
    unknown
  >;
  const text = (value: unknown) =>
    typeof value === "string" ? value : undefined;
  return {
    hostname: text(hostname),
    httpsPort: text(httpsPort),
    wsPath: text(wsPath),
    wsPort: text(wsPort),
  };
};

const given: PortalUrlSettings = Object.fromEntries(
  Object.entries({
    hostname: args.hostname,
    httpsPort: validatePort("https-port", args["https-port"]),
    wsPath: args["ws-path"],
    wsPort: validatePort("ws-port", args["ws-port"]),
  }).filter(([, value]) => value !== undefined),
);

const settings: PortalUrlSettings = { ...readSettings(), ...given };
if (Object.keys(given).length > 0) {
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
}

const { hostname, httpsPort, wsPath, wsPort } = settings;

if (!wsPort && !httpsPort && !wsPath && !hostname) {
  process.exit(0);
}

const configPath = (target: string) =>
  path.join(vuuUiRoot, "dist_portal", target, "config.json");

const readConfig = (target: string): Record<string, unknown> | undefined => {
  const file = configPath(target);
  return fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : undefined;
};

const urlField = (config: Record<string, unknown>, field: string) => {
  const value = config[field];
  if (typeof value !== "string") {
    throw Error(`portal-host config.json has no ${field}`);
  }
  return new URL(value);
};

const hostConfig = readConfig("portal-host");
if (!hostConfig) {
  throw Error(
    `${configPath("portal-host")} not found: run 'npm run build:mf' first`,
  );
}
const websocketUrl = urlField(hostConfig, "websocketUrl");
const restUrl = urlField(hostConfig, "restUrl");

if (hostname) {
  websocketUrl.hostname = hostname;
  restUrl.hostname = hostname;
}
if (wsPort) websocketUrl.port = wsPort;
if (httpsPort) restUrl.port = httpsPort;
if (wsPath) websocketUrl.pathname = wsPath;

const urls = {
  restUrl: restUrl.toString(),
  websocketUrl: websocketUrl.toString(),
};

/** Built targets whose config.json points at the portal Vuu server. */
const portalTargets = ["portal-host", "module-admin"];

for (const target of portalTargets) {
  const config = target === "portal-host" ? hostConfig : readConfig(target);
  if (!config) {
    console.log(`[portal urls] ${target} not built, skipped`);
    continue;
  }
  if (
    config.restUrl === urls.restUrl &&
    config.websocketUrl === urls.websocketUrl
  ) {
    continue;
  }
  const updated = { ...config, ...urls };
  fs.writeFileSync(configPath(target), `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`[portal urls] ${target}/config.json updated`);
}
console.log(
  `[portal urls] portal Vuu server: ${urls.websocketUrl}, ${urls.restUrl}`,
);
