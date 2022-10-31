import shell from "shelljs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

function buildPackage(packageName) {
  shell.cd(`uitk/packages/${packageName}`);
  shell.exec(`node ../../../scripts/run-build-uitk.mjs${dev}${cjs}`);
  shell.cd("../../..");
}

const packages = ["icons", "core", "lab"];

packages.forEach((packageName) => buildPackage(packageName));
