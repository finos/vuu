import shell from "shelljs";

const packages = [
  "utils",
  "react-utils",
  "theme",
  "data-remote",
  "data-store",
  "datagrid-parsers",
  "ui-controls",
  "data-grid",
  "layout",
  "parsed-input",
  "shell",
];

function publishPackage(packageName) {
  shell.cd(`dist/${packageName}`);
  shell.exec(
    "npm publish --registry https://registry.npmjs.org --access-public --dry-run"
  );
  shell.cd("../..");
}

packages.forEach((packageName) => publishPackage(packageName));
