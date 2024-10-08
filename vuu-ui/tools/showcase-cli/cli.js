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

/** Parse the command line */
var args = process.argv.slice(2);

// Validate input
if (args.length !== 1) {
  console.log("Warning: Requires 1 argument");
  console.log("node config-path");
  process.exit();
}

const configPath = args[0];

// const dirsrc = path.dirname(configPath);
if (!fs.existsSync(configPath)) {
  console.log("Error: Config file doesn't exist. Given: ", configPath);
  process.exit();
}

const templateDir = path.resolve(fileURLToPath(import.meta.url), "../dist");

if (!fs.existsSync(".showcase")) {
  createFolder(".showcase");
  await writeFile(indexHtml, "./.showcase/index.html");
} else {
  console.log(".showcase folder present and correct");
}

if (fs.existsSync(templateDir)) {
  copyFiles(templateDir, "./.showcase");
}

const config = readJson(configPath);
//TODO use type validator to check config file
const { exhibits } = config;
if (!fs.existsSync(exhibits)) {
  console.log("Error: Exhibits location doesn't exist. Given: ", exhibits);
  process.exit();
}

import("./cli/main.ts").then(({ default: start }) => {
  start(config);
});
