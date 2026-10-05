import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";
import { localVuuServers } from "../src/local-vuu-servers";

interface RemoteBuildConfig {
  manifest?: { remote?: { connectionId?: string } };
  paths?: { publicPath?: string };
  target?: string;
}

const portalExamplesDir = path.resolve(__dirname, "../..");

/** The config.json each remote publishes, keyed by the URL it is served from. */
const remoteConfigsByUrl = new Map(
  readdirSync(portalExamplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap(({ name }) => {
      try {
        return [
          JSON.parse(
            readFileSync(
              path.join(portalExamplesDir, name, "portal-build.json"),
              "utf8",
            ),
          ) as RemoteBuildConfig,
        ];
      } catch {
        return [];
      }
    })
    .filter(({ target }) => target === "remote-module")
    .map(({ manifest, paths }) => [
      paths?.publicPath?.replace(/\/+$/, ""),
      manifest?.remote,
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
