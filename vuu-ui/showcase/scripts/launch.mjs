import { execWait } from "../../scripts/utils.mjs";
import open from "open";

// await execWait("npm run --silent build");
// await execWait(`npm run --silent build:app${url}`);

execWait(`npx serve -p 3020 -s ./dist`);

setTimeout(() => {
  open("http://localhost:3020/index.html");
}, 2000);
