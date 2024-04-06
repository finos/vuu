import fs from "fs";
import { parseTheme } from "./parse-theme.ts";

const outdir = "./generated";

const writeFile = async (json, path) =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(json, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

// There are no dupes in the data being sorted
// const byVariableName = ([v1], [v2]) => (v2 > v1 ? -1 : 1);

function main() {
  // const path = "../../dist/vuu-theme/index.css";
  const path = "./test-css/index.css";
  const rawdata = fs.readFileSync(path);

  const variableRegistry = parseTheme(rawdata.toString());
  console.log(`parsed ${variableRegistry.count} custom variables`);

  variableRegistry.storeReferences();

  // scopeList.scopes.forEach((scope) => console.log(`\n${scope.toString()}`));

  // writeFile(customPropertyMap, `${outdir}/variablelist.json`);
  // for (const [selectorList, customProperties] of scopes.entries()) {
  //   if (customProperties.length > 0) {
  //     console.log(`\n${selectorList.toString()}`);
  //     customProperties.forEach((property) => {
  //       console.log(
  //         `\t${property.name} <${property.scope.join(",")}> ${
  //           property.references !== null ? " ==> " + property.references : ""
  //         }`
  //       );
  //     });
  //   }
  // }
}

main();
