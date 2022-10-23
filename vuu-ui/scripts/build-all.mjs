import shell from "shelljs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

function buildPackage(packageName) {
  shell.cd(`packages/${packageName}`);
  shell.exec(`yarn --silent build${dev}${cjs}`);
  shell.cd("../..");
}

const packages = [
  "utils",
  "ag-grid",
  "react-utils",
  "theme",
  "theme-uitk",
  "data-remote",
  "data-store",
  "datagrid-parsers",
  "ui-controls",
  "data-grid",
  "layout",
  "parsed-input",
  "shell",
];

packages.forEach((packageName) => buildPackage(packageName));
