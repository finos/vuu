import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getPortalDependencyVersions,
  getSharedDependencies,
} from "../../../scripts/module-federation-utils";

const temporaryDirectories: string[] = [];

const createPortalExamples = (
  packages: Record<string, Record<string, string>>,
) => {
  const directory = mkdtempSync(path.join(tmpdir(), "vuu-module-federation-"));
  temporaryDirectories.push(directory);

  for (const [packageName, dependencies] of Object.entries(packages)) {
    const packageDirectory = path.join(directory, packageName);
    mkdirSync(packageDirectory);
    writeFileSync(
      path.join(packageDirectory, "package.json"),
      JSON.stringify({ dependencies, name: packageName }),
    );
  }

  return directory;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("module-federation-utils", () => {
  it("derives shared dependency versions from portal package.json files", () => {
    const directory = createPortalExamples({
      host: {
        "@vuu-ui/core": "3.3.8",
        react: "^19.2.3",
        "react-dom": "^19.2.3",
        "react-router-dom": "^6.2.1",
      },
      remote: {
        "@vuu-ui/vuu-shell": "3.3.8",
        "@vuu-ui/vuu-theme": "3.3.8",
        react: "^19.2.3",
        "react-dom": "^19.2.3",
      },
    });

    expect(getPortalDependencyVersions(directory)).toEqual({
      reactVersion: "^19.2.3",
      reactRouterVersion: "^6.2.1",
      vuuVersion: "3.3.8",
    });
  });

  it("reports every declaration when shared versions disagree", () => {
    const directory = createPortalExamples({
      host: {
        "@vuu-ui/core": "3.3.8",
        react: "^19.2.3",
        "react-dom": "^19.2.3",
        "react-router-dom": "^6.2.1",
      },
      remote: {
        "@vuu-ui/vuu-shell": "3.3.7",
        react: "^19.2.3",
        "react-dom": "^19.2.3",
      },
    });

    expect(() => getPortalDependencyVersions(directory)).toThrowError(
      [
        "Inconsistent VUU dependency versions in portal package.json files:",
        "  3.3.8: host (@vuu-ui/core)",
        "  3.3.7: remote (@vuu-ui/vuu-shell)",
      ].join("\n"),
    );
  });

  it("uses the validated portal versions in federation configuration", () => {
    const versions = getPortalDependencyVersions();
    const sharedDependencies = getSharedDependencies("consumer");

    expect(sharedDependencies.react.requiredVersion).toBe(
      versions.reactVersion,
    );
    expect(sharedDependencies["react-router-dom"].requiredVersion).toBe(
      versions.reactRouterVersion,
    );
    expect(sharedDependencies["@vuu-ui/core"].requiredVersion).toBe(
      versions.vuuVersion,
    );
  });
});
