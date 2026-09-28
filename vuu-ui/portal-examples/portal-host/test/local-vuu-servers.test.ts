import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";
import { localVuuServers } from "../src/local-vuu-servers";

describe("local Vuu servers", () => {
  it("implements every server listed in the local registry", () => {
    expect(
      localVuuServers.map(({ connectionId, title }) => ({
        connectionId,
        title,
      })),
    ).toEqual(
      localPortalModuleRegistry.servers.map(({ connectionId, title }) => ({
        connectionId,
        title,
      })),
    );
    expect(
      localVuuServers.every(
        ({ DataSourceProvider }) => typeof DataSourceProvider === "function",
      ),
    ).toBe(true);
  });
});
