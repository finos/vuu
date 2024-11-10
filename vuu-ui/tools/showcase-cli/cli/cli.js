#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { copyFiles, createFolder, readJson, writeFile } from "./cli-utils.ts";
import indexHtml from "../templates/index.html.ts";
import { fileURLToPath } from "url";
import prepare from "./prepare.ts";
import start from "./main.ts";

/** Parse the command line */
var args = process.argv.slice(2);

let configFilePath = "./showcase.config.json";

// Validate input
if (args.length === 0) {
  if (!fs.existsSync(configFilePath)) {
    console.log("Warning: Requires 1 argument, path to config file. ");
    process.exit();
  } else {
    console.log("using config file at './showcase.config.json'");
  }
} else {
  if (fs.existsSync(args[0])) {
    configFilePath = args[0];
  } else {
    console.log(
      `Warning: first argument ${args[0]} should be path to config file, file not found`,
    );
    process.exit();
  }
}

const distFolder = path.resolve(fileURLToPath(import.meta.url), "../../dist");

if (!fs.existsSync(".showcase")) {
  createFolder(".showcase");
  // Don't do this until we create importmaps
  await writeFile(indexHtml, "./.showcase/index.html");
} else {
  console.log(".showcase folder present and correct");
}

// TODO check whether dist files already present in .showcase
if (fs.existsSync(distFolder)) {
  console.log(`copy dist files from dist folder ${distFolder} to .showcase `);
  copyFiles(distFolder, "./.showcase");
} else {
  console.log(`no dist folder ${distFolder}`);
}

const config = readJson(configFilePath);

const [exhibitsJson, treeSourceJson] = await prepare(config);

await writeFile(
  `export default ${JSON.stringify(exhibitsJson, null, 2)};`,
  "./.showcase/exhibits.js",
);

await writeFile(
  `export default ${JSON.stringify(treeSourceJson, null, 2)};`,
  "./.showcase/treeSourceJson.js",
);

start(config, exhibitsJson, treeSourceJson);
