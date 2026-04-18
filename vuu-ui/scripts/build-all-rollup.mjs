import { execWait, getCommandLineArg } from "./utils.mjs";

const jsonOutput = getCommandLineArg("json", false);

export const buildAll = async () => {
  const buildPackage = async (packageName) =>
    execWait(`npm run --silent build`, `packages/${packageName}`).catch(
      (err) => {
        console.error(`[${packageName}] ${err.toString()}`);
        process.exit(1);
      },
    );

  // TODO determine the dependency graph/build order programatically
  const wave1 = [
    "vuu-data-types",
    "vuu-table-types",
    "vuu-filter-types",
    "vuu-protocol-types",
    "vuu-data-test",
    "vuu-filter-parser",
    "vuu-icons",
    "vuu-utils",
    "vuu-codemirror",
    "vuu-theme",
  ];
  const wave2 = [
    "vuu-data-remote",
    "vuu-data-local",
    "vuu-notifications",
    "vuu-ui-controls",
  ];
  const wave3 = ["vuu-filters", "vuu-popups"];
  const wave4 = [
    "vuu-context-menu",
    "vuu-datatable",
    "vuu-table",
    "vuu-data-react",
    "vuu-table-extras",
    "vuu-layout",
    "vuu-shell",
  ];

  if (jsonOutput) {
    console.log(
      JSON.stringify({
        "package-list": wave1.concat(wave2).concat(wave3).concat(wave4),
      }),
    );
  }

  await Promise.all(wave1.map(buildPackage));
  await Promise.all(wave2.map(buildPackage));
  await Promise.all(wave3.map(buildPackage));
  await Promise.all(wave4.map(buildPackage));
};

buildAll();
