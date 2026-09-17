import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";

describe("local portal module registry", () => {
  it("uses local adapter exposures without remote VUU connections", () => {
    expect(localPortalModuleRegistry.modules).toHaveLength(3);
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
        mfComponent: "UserAdminLocal",
        mfScope: "userAdmin",
        mfUrl: "http://localhost:5007",
      },
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
    expect(localPortalModuleRegistry.modules[0].ComponentProps).toEqual({
      config: {
        clients: { table: { module: "USER_ADMIN", table: "clients" } },
        group_roles: {
          table: { module: "USER_ADMIN", table: "group_roles" },
        },
        groups: { table: { module: "USER_ADMIN", table: "groups" } },
        roles: { table: { module: "USER_ADMIN", table: "roles" } },
        user_group_roles: {
          table: { module: "USER_ADMIN", table: "user_group_roles" },
        },
        user_groups: {
          table: { module: "USER_ADMIN", table: "user_groups" },
        },
        users: { table: { module: "USER_ADMIN", table: "users" } },
      },
    });
  });
});
