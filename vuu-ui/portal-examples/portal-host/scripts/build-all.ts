import { getCommandLineArg, runCommandSync } from "../../../scripts/utils.ts";

const packages = [
	"simple-login-service",
	"portal-host",
	"basket-trading",
	"feature-filter-table",
	"module-admin",
	"feature-simple-div",
	"user-admin",
	"feature-instrument-tiles",
	"vuu-table-browser",
	"vuu-table-viewer",
] as const;

type PackageName = (typeof packages)[number];

const requestedFlags = packages.filter(
	(pkg): pkg is PackageName => getCommandLineArg(`--${pkg}`) === pkg,
);

if (requestedFlags.length > 1) {
	console.error(
		`Expected at most one package flag, received: ${requestedFlags
			.map((name) => `--${name}`)
			.join(", ")}`,
	);
	process.exit(1);
}

const selectedPackage = requestedFlags[0] as PackageName | undefined;
const packagesToBuild = selectedPackage ? [selectedPackage] : [...packages];

for (const pkg of packagesToBuild) {
	console.log(`\nBuilding ${pkg}...`);
	runCommandSync("npm", ["--prefix", `portal-examples/${pkg}`, "run", "build"]);
}

console.log("\nModule federation builds completed successfully.");
