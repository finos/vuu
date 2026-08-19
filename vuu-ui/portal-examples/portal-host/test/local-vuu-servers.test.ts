import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";
import { localVuuServers } from "../src/local-vuu-servers";

describe("local Vuu servers", () => {
  it("implements every connection referenced by the local registry", () => {
    const connectionIds = new Set(
      localPortalModuleRegistry.modules.flatMap(({ vuu }) =>
        vuu ? [vuu.connectionId] : [],
      ),
    );
    expect(
      new Set(localVuuServers.map(({ connectionId }) => connectionId)),
    ).toEqual(connectionIds);
  });
});
