#!/usr/bin/env node
import { Command } from "commander";
import gradient from "gradient-string";
import { buildAll } from "../scripts/build-all.mjs";
import { launchApp } from "../scripts/launch-app.mjs";

const poimandresTheme = {
  blue: "#add7ff",
  cyan: "#89ddff",
  green: "#5de4c7",
  magenta: "#fae4fc",
  red: "#d0679d",
  yellow: "#fffac2",
};

console.log(
  gradient(Object.values(poimandresTheme))
    .multiline(` ___      ___ ___  ___  ___  ___     
|\\  \\    /  /|\\  \\|\\  \\|\\  \\|\\  \\    
\\ \\  \\  /  / | \\  \\\\\\  \\ \\  \\\\\\  \\   
 \\ \\  \\/  / / \\ \\  \\\\\\  \\ \\  \\\\\\  \\  
  \\ \\    / /   \\ \\  \\\\\\  \\ \\  \\\\\\  \\ 
   \\ \\__/ /     \\ \\_______\\ \\_______\\
    \\|__|/       \\|_______|\\|_______|                   
`)
);

const program = new Command();

program.command("build").action(buildAll);
program
  .command("run")
  .option("-w --websocket <type>", "URL for websocket")
  .action(launchApp);

// eslint-disable-next-line no-undef
program.parse();

// const options = program.opts();
// console.log(options);
