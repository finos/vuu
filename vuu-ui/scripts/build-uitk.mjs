import { execWait } from "./utils.mjs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

function buildPackage(packageName) {
  execWait(
    `node ../../../scripts/run-build-uitk.mjs${dev}${cjs}`,
    `uitk/packages/${packageName}`
  );
}

const packages = ["icons", "core", "lab"];

packages.forEach((packageName) => buildPackage(packageName));
