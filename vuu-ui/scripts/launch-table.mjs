import { execWait } from "./utils.mjs";

export const launchApp = async () => {
  const appName = "standalone-table";
  execWait(`serve -p 3010 ./deployed_apps/${appName}`);
};

await launchApp();
