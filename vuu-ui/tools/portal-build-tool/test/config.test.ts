import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createPortalBuildPlan,
  loadPortalBuildConfig,
  parsePortalBuildConfig,
} from "../src/index.js";

const temporaryDirectories: string[] = [];

const createFixture = (overrides: Record<string, unknown> = {}) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "portal-build-tool-"));
  temporaryDirectories.push(root);
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      dependencies: {
        "@vuu-ui/core": "3.3.12",
        react: "^19.2.3",
      },
    }),
  );
  writeFileSync(
    path.join(root, "portal-build.json"),
    JSON.stringify({
      version: 1,
      paths: {
        htmlTemplate: "./public/index.html",
        output: "./dist",
        entries: {
          remote: "./src/index.tsx",
          local: "./src/local-index.tsx",
        },
      },
      manifest: {
        filename: "./config.json",
        remote: { ssl: true },
        local: { ssl: false },
      },
      moduleFederation: {
        name: "host",
        shared: {
          react: {
            requiredVersion: "package",
            singleton: true,
          },
          "@vuu-ui/core/portal": {
            requiredVersion: "package:@vuu-ui/core",
            singleton: true,
          },
        },
      },
      ...overrides,
    }),
  );
  return root;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("portal build configuration", () => {
  it("validates the required application configuration", () => {
    expect(() =>
      parsePortalBuildConfig({
        version: 1,
        paths: {},
      }),
    ).toThrow("paths.entries");
  });

  it("loads paths relative to the configuration and resolves package versions", () => {
    const root = createFixture();
    const loaded = loadPortalBuildConfig(
      path.join(root, "portal-build.json"),
    );

    const remotePlan = createPortalBuildPlan(loaded, "remote");
    expect(remotePlan.entry).toBe(path.join(root, "src/index.tsx"));
    expect(remotePlan.outputRoot).toBe(path.join(root, "dist"));
    expect(remotePlan.manifest.value).toEqual({ ssl: true });
    expect(remotePlan.moduleFederation.shared.react?.requiredVersion).toBe(
      "^19.2.3",
    );
    expect(
      remotePlan.moduleFederation.shared["@vuu-ui/core/portal"]
        ?.requiredVersion,
    ).toBe("3.3.12");
  });

  it("plans local builds with independent entries and manifests", () => {
    const root = createFixture({
      builds: {
        local: {
          entry: "./src/local-entry.tsx",
          output: "./local-dist",
          manifest: { ssl: false, mode: "local" },
        },
      },
    });
    const loaded = loadPortalBuildConfig(
      path.join(root, "portal-build.json"),
    );

    const localPlan = createPortalBuildPlan(loaded, "local");
    expect(localPlan.entry).toBe(path.join(root, "src/local-entry.tsx"));
    expect(localPlan.outputRoot).toBe(path.join(root, "local-dist"));
    expect(localPlan.manifest.value).toEqual({
      ssl: false,
      mode: "local",
    });
  });

  it("plans a remote module from its standalone build contract", () => {
    const root = createFixture();
    const remoteModuleConfig = {
      version: 1,
      target: "remote-module",
      paths: {
        entry: "./src/index.tsx",
        htmlTemplate: "../remote-module-template/index.html",
        output: "./dist/example",
        publicPath: "http://localhost:5002/",
      },
      moduleFederation: {
        name: "example",
        dts: false,
        exposes: {
          "./Feature": "./src/Feature",
        },
        shared: {
          react: {
            requiredVersion: "^19.2.3",
          },
        },
      },
    };
    writeFileSync(
      path.join(root, "portal-build.json"),
      JSON.stringify(remoteModuleConfig),
    );

    const loaded = loadPortalBuildConfig(
      path.join(root, "portal-build.json"),
    );
    const plan = createPortalBuildPlan(loaded);

    expect(plan.target).toBe("remote-module");
    expect(plan.entry).toBe(path.join(root, "src/index.tsx"));
    expect(plan.htmlTemplate).toBe(
      path.resolve(root, "../remote-module-template/index.html"),
    );
    expect(plan.publicPath).toBe("http://localhost:5002/");
    expect(plan.exposes).toEqual({ "./Feature": "./src/Feature" });
    expect(plan.moduleFederation.name).toBe("example");
  });

  it("rejects remote modules without an exposed module", () => {
    expect(() =>
      parsePortalBuildConfig({
        version: 1,
        target: "remote-module",
        paths: {
          entry: "./src/index.tsx",
          htmlTemplate: "./index.html",
          output: "./dist",
          publicPath: "http://localhost:5002/",
        },
        moduleFederation: {
          name: "example",
          shared: {},
        },
      }),
    ).toThrow("moduleFederation.exposes");
  });
});
