import open from "open";
import { execWait, getCommandLineArg } from "./utils.mjs";

export const launchApp = async (websocket) => {
  let websocketUrl;

  const isBasket = getCommandLineArg("--basket", false);
  console.log({ isBasket });
  const appName = isBasket ? "app-vuu-basket-trader" : "app-vuu-example";

  if (websocket) {
    websocketUrl = getCommandLineArg("--url", true);

    if (!websocketUrl) {
      console.log(`No url supplied for websocket, default will be wss://127.0.0.1:8090/websocket

  > npm run launch:app --url=wss://vuu.server.domain:8090/websocket

  `);
    }
  } else {
    websocketUrl = websocket;
  }

  const url = websocketUrl ? ` --url ${websocketUrl}` : "";

  // await execWait("npm run --silent build");

  const buildTarget = isBasket ? "app:basket" : "app";

  execWait(`serve -p 3010 ./deployed_apps/${appName}`);
  // await execWait("npm run --silent build");
  // await execWait(`npm run --silent build:${buildTarget}${url}`);

  setTimeout(() => {
    open("http://localhost:3010/demo");
  }, 2000);
};

await launchApp();
