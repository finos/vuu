import { execWait, getCommandLineArg, withArgs } from "./utils.mjs";

const jsonOutput = getCommandLineArg("json", false);

export const buildAll = async () => {
  const buildPackage = async (packageName) =>
    execWait(
      `npm run --silent build${withArgs("dev", "debug")}`,
      `themes/${packageName}`
    );

  // TODO determine the dependency graph/build order programatically
  const packages = [];

  if (jsonOutput) {
    console.log(
      JSON.stringify({
        "package-list": packages,
      })
    );
  }

  await Promise.all(packages.map(buildPackage));
};

buildAll();
