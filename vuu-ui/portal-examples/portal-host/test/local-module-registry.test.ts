import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";

describe("local portal module registry", () => {
  it("uses local adapter exposures without remote VUU connections", () => {
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
        mfComponent: "ModuleAdminLocal",
        mfScope: "moduleAdmin",
        mfUrl: "http://localhost:5002",
      },
      {
        mfComponent: "UserAdminLocal",
        mfScope: "userAdmin",
        mfUrl: "http://localhost:5003",
      },
      {
        mfComponent: "VuuTableBrowser",
        mfScope: "vuuTableBrowser",
        mfUrl: "http://localhost:5004",
      },
      {
        mfComponent: "VuuTableViewer",
        mfScope: "vuuTableViewer",
        mfUrl: "http://localhost:5005",
      },
      {
        mfComponent: "VuuBasketTradingFeatureLocal",
        mfScope: "basketTrading",
        mfUrl: "http://localhost:5006",
      },
      {
        mfComponent: "SimpleDivLocal",
        mfScope: "simpleDiv",
        mfUrl: "http://localhost:5007",
      },
    ]);
    expect(
      localPortalModuleRegistry.modules.every(
        (descriptor) => !("vuu" in descriptor),
      ),
    ).toBe(true);
    expect(
      localPortalModuleRegistry.modules.find(
        ({ name }) => name === "user-admin",
      )?.ComponentProps,
    ).toEqual({
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

  it("loads basket trading from its nginx endpoint", () => {
    expect(
      localPortalModuleRegistry.modules.find(
        ({ name }) => name === "basket-trading",
      ),
    ).toMatchObject({
      mfScope: "basketTrading",
      mfUrl: "http://localhost:5006",
    });
  });

  it("maps module-admin to its local adapter manifest and permitted metadata", () => {
    const moduleAdmin = localPortalModuleRegistry.modules.find(
      ({ name }) => name === "module-admin",
    );
    expect(moduleAdmin).toMatchObject({
      clientIdentifier: "vuu-module-admin",
      id: "local-module-admin",
      accessRole: "module-admin-access",
      mfComponent: "ModuleAdminLocal",
      mfScope: "moduleAdmin",
      mfUrl: "http://localhost:5002",
      name: "module-admin",
      path: "/administration/modules",
    });
    expect(moduleAdmin).not.toHaveProperty("vuu");
  });

  it("lists the Vuu servers offered by the table browser", () => {
    expect(
      localPortalModuleRegistry.servers.map(({ connectionId }) => connectionId),
    ).toEqual(["simul", "basket", "admin"]);
  });
});
