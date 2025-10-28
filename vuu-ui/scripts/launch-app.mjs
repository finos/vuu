import open from "open";
import { execWait } from "./utils.mjs";

export const launchApp = async () => {
  const appName = "app-vuu-example";
  execWait(`serve -p 3010 ./deployed_apps/${appName}`);
  setTimeout(() => {
    open("http://localhost:3010/login");
  }, 2000);
};
await launchApp();
