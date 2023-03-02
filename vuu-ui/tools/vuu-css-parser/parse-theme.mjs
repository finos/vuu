import fs from "fs";

import { parseTheme } from "./css-parser.mjs";

const outdir = "./generated";

const writeFile = async (json, path) =>
  new Promise((resolve, reject) => {
    console.log(`write bundle metafile`);
    fs.writeFile(path, JSON.stringify(json, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

// There are no dupes in the data being sorted
const byVariableName = ([v1], [v2]) => (v2 > v1 ? -1 : 1);

function main() {
  const path = "../../dist/vuu-theme/index.css";
  let rawdata = fs.readFileSync(path);

  const { customPropertyMap, scopes, tagCodes } = parseTheme(
    rawdata.toString()
  );

  console.log(tagCodes);
  console.log(
    `we have ${Object.keys(customPropertyMap).length} custom properties`
  );

  const variableList = {};
  for (const [variableName, scopes] of Object.entries(customPropertyMap).sort(
    byVariableName
  )) {
    variableList[variableName] = scopes;
  }

  writeFile(customPropertyMap, `${outdir}/variablelist.json`);
  //   for (const [selectorList, customProperties] of scopes.entries()) {
  //     if (customProperties.length > 0) {
  //       console.log(`\n${selectorList.toString()}`);
  //       customProperties.forEach((property) => {
  //         console.log(
  //           `\t${property.name} <${property.scope.join(",")}> ${
  //             property.references !== null ? " ==> " + property.references : ""
  //           }`
  //         );
  //       });
  //     }
  //   }
}

main();
