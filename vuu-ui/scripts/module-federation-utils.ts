import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  dependencies?: Record<string, string>;
  name?: string;
}

interface DependencyDeclaration {
  dependency: string;
  packageName: string;
  version: string;
}

export interface PortalDependencyVersions {
  reactVersion: string;
  reactRouterVersion: string;
  vuuVersion: string;
}

const portalExamplesDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../portal-examples",
);

const readPackageJson = (packageJsonPath: string): PackageJson => {
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
  } catch (error) {
    throw new Error(
      `Unable to read portal package.json file ${packageJsonPath}`,
      { cause: error },
    );
  }
};

const getPortalPackages = (directory: string) => {
  const packageJsonPaths = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "package.json"))
    .filter(existsSync)
    .sort();

  if (packageJsonPaths.length === 0) {
    throw new Error(`No portal package.json files found in ${directory}`);
  }

  return packageJsonPaths.map((packageJsonPath) => {
    const packageJson = readPackageJson(packageJsonPath);
    return {
      dependencies: packageJson.dependencies ?? {},
      packageName: packageJson.name ?? path.basename(path.dirname(packageJsonPath)),
    };
  });
};

const getConsistentVersion = (
  groupName: string,
  declarations: DependencyDeclaration[],
) => {
  if (declarations.length === 0) {
    throw new Error(
      `No ${groupName} dependencies found in portal package.json files`,
    );
  }

  const versions = new Map<string, DependencyDeclaration[]>();
  for (const declaration of declarations) {
    const matchingDeclarations = versions.get(declaration.version) ?? [];
    matchingDeclarations.push(declaration);
    versions.set(declaration.version, matchingDeclarations);
  }

  if (versions.size > 1) {
    const details = [...versions.entries()]
      .map(
        ([version, matchingDeclarations]) =>
          `  ${version}: ${matchingDeclarations
            .map(
              ({ dependency, packageName }) =>
                `${packageName} (${dependency})`,
            )
            .join(", ")}`,
      )
      .join("\n");

    throw new Error(
      `Inconsistent ${groupName} dependency versions in portal package.json files:\n${details}`,
    );
  }

  return declarations[0].version;
};

export const getPortalDependencyVersions = (
  directory = portalExamplesDirectory,
): PortalDependencyVersions => {
  const packages = getPortalPackages(directory);
  const reactDeclarations: DependencyDeclaration[] = [];
  const reactRouterDeclarations: DependencyDeclaration[] = [];
  const vuuDeclarations: DependencyDeclaration[] = [];

  for (const { dependencies, packageName } of packages) {
    for (const [dependency, version] of Object.entries(dependencies)) {
      const declaration = { dependency, packageName, version };

      if (dependency === "react" || dependency === "react-dom") {
        reactDeclarations.push(declaration);
      } else if (dependency === "react-router-dom") {
        reactRouterDeclarations.push(declaration);
      } else if (dependency.startsWith("@vuu-ui/")) {
        vuuDeclarations.push(declaration);
      }
    }
  }

  return {
    reactVersion: getConsistentVersion("React", reactDeclarations),
    reactRouterVersion: getConsistentVersion(
      "React Router",
      reactRouterDeclarations,
    ),
    vuuVersion: getConsistentVersion("VUU", vuuDeclarations),
  };
};

export const getSharedDependencies = (env: "consumer" | "producer") => {
  const { reactVersion, reactRouterVersion, vuuVersion } =
    getPortalDependencyVersions();

  if (env === "consumer") {
    return {
      react: {
        singleton: true,
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "react-dom": {
        singleton: true,
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "react-router-dom": {
        singleton: true,
        requiredVersion: reactRouterVersion,
        strictVersion: true,
      },
      "@vuu-ui/core": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/core/portal": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-data-editing": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-shell": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
    };
  } else {
    return {
      react: {
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "react-dom": {
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "react-router-dom": {
        singleton: true,
        requiredVersion: reactRouterVersion,
        strictVersion: true,
      },
      "@vuu-ui/core": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/core/portal": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-data-editing": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-shell": {
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
    };
  }
};
