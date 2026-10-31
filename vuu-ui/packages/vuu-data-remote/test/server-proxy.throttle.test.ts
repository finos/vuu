import "./global-mocks";
import { describe, it } from "vitest";
import { rows, serverProxyHarness, size } from "./server-proxy-dsl";

describe("ServerProxy 'size-only throttling'", () => {
  // Ported as is: the original makes no assertions.
  it("passes a size only message through to UI client", async () => {
    const t = await serverProxyHarness();
    t.server.sends(size(), rows(0, 10));
  });
});
