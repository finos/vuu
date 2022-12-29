import { execWait } from "./utils.mjs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

function buildPackage(packageName) {
  execWait(
    `node ../../../scripts/run-build-salt.mjs${dev}${cjs}`,
    `salt/packages/${packageName}`
  );
}

const packages = ["lab"];

packages.forEach((packageName) => buildPackage(packageName));
