#!/usr/bin/env node
import { buildPortal } from "./build.ts";
import type { PortalBuildMode } from "./config.ts";

const getOption = (args: string[], name: string): string | undefined => {
  const index = args.indexOf(name);
  if (index >= 0) {
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Expected a value after ${name}`);
    }
    return value;
  }
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  return inline?.slice(prefix.length);
};

const run = async () => {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: portal-build [--config <path>] [--local|--remote] [--rsdoctor]",
        "",
        "Build a configured portal application with Rsbuild.",
      ].join("\n"),
    );
    return;
  }

  const mode: PortalBuildMode = args.includes("--local") ? "local" : "remote";
  await buildPortal({
    configPath: getOption(args, "--config") ?? "portal-build.json",
    mode,
    rsdoctor: args.includes("--rsdoctor"),
  });
};

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
