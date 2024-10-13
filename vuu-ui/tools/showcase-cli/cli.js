#!/usr/bin/env node

import fs from "fs";
import path from "path";
import {
  copyFiles,
  createFolder,
  readJson,
  writeFile,
} from "./cli/cli-utils.ts";
import indexHtml from "./templates/index.html.ts";
import { fileURLToPath } from "url";
import start from "./cli/main.ts";
import { buildPackageTree } from "./cli/buildPackageTree";

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

const distFolder = path.resolve(fileURLToPath(import.meta.url), "../dist");

if (!fs.existsSync(".showcase")) {
  createFolder(".showcase");
  // DOn't do this until we create importmaps
  await writeFile(indexHtml, "./.showcase/index.html");
} else {
  console.log(".showcase folder present and correct");
}

// TODO check whether dist files already present in .showcase
if (fs.existsSync(distFolder)) {
  copyFiles(distFolder, "./.showcase");
}

const config = readJson(configFilePath);

//TODO use type validator to check config file
const { exhibits } = config;
if (!fs.existsSync(exhibits)) {
  console.log("Error: Exhibits location doesn't exist. Given: ", exhibits);
  process.exit();
}

const stories = buildPackageTree(exhibits);
await writeFile(
  `export default ${JSON.stringify(stories, null, 2)};`,
  "./.showcase/exhibits.js",
);

console.log(JSON.stringify(stories, null, 2));

start(config);
