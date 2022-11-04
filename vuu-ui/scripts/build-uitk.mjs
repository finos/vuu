import { exec } from "child_process";
import { execCallback } from "./utils.mjs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

function buildPackage(packageName) {
  exec(
    `node ../../../scripts/run-build-uitk.mjs${dev}${cjs}`,
    { cwd: `uitk/packages/${packageName}` },
    execCallback
  );
}

const packages = ["icons", "core", "lab"];

packages.forEach((packageName) => buildPackage(packageName));
