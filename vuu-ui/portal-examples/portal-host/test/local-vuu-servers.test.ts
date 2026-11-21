import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadPortalBuildConfig } from "../../../tools/portal-build-tool/src/config";
import { localPortalModuleRegistry } from "../src/local-module-registry";
import { localVuuServers } from "../src/local-vuu-servers";

const portalExamplesDir = path.resolve(__dirname, "../..");

/** The config.json each remote publishes, keyed by the URL it is served from. */
const remoteConfigsByUrl = new Map(
  readdirSync(portalExamplesDir, { withFileTypes: true })
    .filter(
      ({ name }) =>
        existsSync(path.join(portalExamplesDir, name, "portal-build.json")),
    )
    .map(
      ({ name }) =>
        loadPortalBuildConfig(
          path.join(portalExamplesDir, name, "portal-build.json"),
        ).config,
    )
    .filter(({ target }) => target === "remote-module")
    .map(({ manifest, paths }) => [
      paths.publicPath?.replace(/\/+$/, ""),
      manifest?.remote as { connectionId?: string } | undefined,
    ]),
);

describe("local Vuu servers", () => {
  it("implements every connection published by the remotes in the local registry", () => {
    const connectionIds = new Set(
      localPortalModuleRegistry.modules.flatMap(({ mfUrl }) => {
        const connectionId = remoteConfigsByUrl.get(mfUrl)?.connectionId;
        return connectionId ? [connectionId] : [];
      }),
    );
    expect(
      new Set(localVuuServers.map(({ connectionId }) => connectionId)),
    ).toEqual(connectionIds);
  });
});
