import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";

describe("local portal module registry", () => {
  it("uses local adapter exposures without remote VUU connections", () => {
    expect(localPortalModuleRegistry.modules).toHaveLength(2);
    expect(
      localPortalModuleRegistry.modules.map(
        ({ mfComponent, mfScope, mfUrl }) => ({
          mfComponent,
          mfScope,
          mfUrl,
        }),
      ),
    ).toEqual([
      {
        mfComponent: "VuuBasketTradingFeatureLocal",
        mfScope: "basketTrading",
        mfUrl: "http://localhost:5005",
      },
      {
        mfComponent: "VuuFilterTableFeatureLocal",
        mfScope: "filterTable",
        mfUrl: "http://localhost:5003",
      },
    ]);
    expect(
      localPortalModuleRegistry.modules.every(
        (descriptor) => !("vuu" in descriptor),
      ),
    ).toBe(true);
  });
});
