import shell from "shelljs";

const packages = ["uitk-core", "uitk-icons", "uitk-lab"];

function publishPackage(packageName) {
  shell.cd(`dist/${packageName}`);
  shell.exec(
    "npm publish --registry https://registry.npmjs.org --access-public"
  );
  shell.cd("../..");
}

packages.forEach((packageName) => publishPackage(packageName));
