import open from "open";
import { execWait, getCommandLineArg } from "./utils.mjs";

export const launchApp = async (websocket) => {
  let websocketUrl;

  if (websocket) {
    websocketUrl = getCommandLineArg("--url", true);

    if (!websocketUrl) {
      console.log(`No url supplied for websocket, default will be wss://127.0.0.1:8090/websocket

  > yarn launch:app --url=wss://vuu.server.domain:8090/websocket

  `);
    }
  } else {
    websocketUrl = websocket;
  }

  const url = websocketUrl ? ` --url ${websocketUrl}` : "";

  await execWait("npm run --silent build");
  await execWait(`npm run --silent build:app${url}`);

  // code from cli branch was following line , replacing 2 lined beneath
  //  execWait(`npx serve -p 3010 ./deployed_apps/app-vuu-example`);
  await execWait("npm run --silent build");
  await execWait(`npm run --silent build:app${url}`);

  setTimeout(() => {
    open("http://localhost:3010/demo");
  }, 2000);
};

await launchApp();
