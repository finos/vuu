import open from "open";
import lws from "local-web-server";
import { getCommandLineArg, readJson, writeJsonFileFile } from "./utils.mjs";

const validateAuthUrl = (url) => {
  if (url.length && !url.startsWith("http")) {
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

const validateWebsocketUrl = (url) => {
  if (url.length && !url.startsWith("ws")) {
    throw Error(`invalid websocket url '${url}'`);
  }
  return url;
};

const validatePort = (port) => {
  if (port.length !== 4 || !/\d\d\d\d/.test(port)) {
    throw Error(`Invalid port ${port}`);
  }
  return port;
};

const authUrl = validateAuthUrl(
  getCommandLineArg("--authurl", true, "https://localhost:8443/api"),
);
const wsUrl = validateWebsocketUrl(
  getCommandLineArg("--wsurl", true, "wss://localhost:8090/websocket"),
);
const port = validatePort(getCommandLineArg("--port", true, "3010"));

console.log(`http server running on port ${port}

  auth url : ${authUrl}/auth
  websocket: ${wsUrl} 
  `);

const DEPLOY_DIR = "./deployed_apps/app-vuu-example";
const configPath = `${DEPLOY_DIR}/config.json`;
const config = readJson(configPath);

writeJsonFileFile(
  {
    ...config,
    websocketUrl: wsUrl,
  },
  configPath,
);

await lws.create({
  directory: DEPLOY_DIR,
  rewrite: [
    {
      from: "/login",
      to: "/login.html",
    },
    {
      // from: "/api/(.*)",
      from: "/api/authn",
      to: `${authUrl}/authn`,
    },
    {
      from: "/api/login",
      to: `${authUrl}/login`,
    },
  ],
  logFormat: "dev",
  port,
});

open("http://localhost:3010/index.html");
