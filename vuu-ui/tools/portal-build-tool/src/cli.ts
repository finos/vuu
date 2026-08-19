#!/usr/bin/env node
import { buildPortal } from "./build.js";
import type { PortalBuildMode } from "./config.js";
import { buildPortalAll } from "./orchestrator.js";

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
        "       portal-build --all-config <path> [--local] [--target <name>]",
        "",
        "Build a configured portal application or a complete portal project.",
      ].join("\n"),
    );
    return;
  }

  const allConfigPath = getOption(args, "--all-config");
  const configPath = getOption(args, "--config");
  if (allConfigPath && configPath) {
    throw new Error("Use either --config or --all-config, not both");
  }
  if (args.includes("--local") && args.includes("--remote")) {
    throw new Error("Use either --local or --remote, not both");
  }
  const mode: PortalBuildMode = args.includes("--local") ? "local" : "remote";
  if (allConfigPath) {
    await buildPortalAll({
      configPath: allConfigPath,
      mode,
      rsdoctor: args.includes("--rsdoctor"),
      targetName: getOption(args, "--target"),
    });
    return;
  }
  if (getOption(args, "--target")) {
    throw new Error("--target requires --all-config");
  }
  await buildPortal({
    configPath: configPath ?? "portal-build.json",
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
