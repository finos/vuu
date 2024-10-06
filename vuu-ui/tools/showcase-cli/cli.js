#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { readJson } from "./src/cli-utils.ts";

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

const config = readJson(configPath);
//TODO use type validator to check config file
const { exhibits } = config;
if (!fs.existsSync(exhibits)) {
  console.log("Error: Exhibits location doesn't exist. Given: ", exhibits);
  process.exit();
}


import("./src/main.ts").then(({ default: start }) => {
  start(config);
});
