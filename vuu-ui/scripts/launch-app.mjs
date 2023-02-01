import { execWait, getCommandLineArg } from "./utils.mjs";
import open from "open";

const websocketUrl = getCommandLineArg("--url", true);

if (!websocketUrl) {
  console.log(`No url supplied for websocket, default will be wss://127.0.0.1:8090/websocket

> yarn launch:app --url=wss://vuu.server.domain:8090/websocket

`);
}

const url = websocketUrl ? ` --url ${websocketUrl}` : "";

await execWait("yarn --silent build");
await execWait(`yarn --silent build:app${url}`);

execWait(`npx serve -p 3010 ./deployed_apps/app-vuu-example`);

setTimeout(() => {
  open("http://localhost:3010/demo");
}, 2000);
