import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import {
  jsonValueWorkspaceComponentCodec,
  type WorkspaceComponentRegistration,
} from "../../src";
import {
  createPortalComponentRegistries,
  portalModuleSettingsCodec,
  portalModuleTemplate,
  vuuTableSettingsCodec,
  vuuTableTemplate,
} from "../../src/portal";

describe("portalModuleSettingsCodec", () => {
  it("decodes valid settings", () => {
    expect(portalModuleSettingsCodec.decode({ moduleId: "42" })).toEqual({
      ok: true,
      value: { moduleId: "42" },
    });
    expect(
      portalModuleSettingsCodec.decode({
        moduleId: "basket",
        props: { side: "BUY" },
      }),
    ).toEqual({
      ok: true,
      value: { moduleId: "basket", props: { side: "BUY" } },
    });
  });

  it.each([
    [null, "$"],
    ["basket", "$"],
    [[], "$"],
    [{}, "$.moduleId"],
    [{ moduleId: "" }, "$.moduleId"],
    [{ moduleId: 42 }, "$.moduleId"],
    [{ moduleId: "a", props: "x" }, "$.props"],
    [{ moduleId: "a", props: [1] }, "$.props"],
    [{ moduleId: "a", location: "" }, "$.location"],
    [{ moduleId: "a", location: 7 }, "$.location"],
  ])("rejects %j at %s", (value, path) => {
    const result = portalModuleSettingsCodec.decode(value as never);
    expect(result).toMatchObject({ error: { path }, ok: false });
  });

  it("keeps the module's saved location", () => {
    expect(
      portalModuleSettingsCodec.decode({
        location: "/admin/users",
        moduleId: "a",
      }),
    ).toEqual({
      ok: true,
      value: { location: "/admin/users", moduleId: "a" },
    });
  });

  it("drops unknown keys when encoding", () => {
    expect(
      portalModuleSettingsCodec.encode({
        moduleId: "a",
        mfUrl: "http://stale",
      } as never),
    ).toEqual({ ok: true, value: { moduleId: "a" } });
  });

  it("recognises settings", () => {
    expect(portalModuleSettingsCodec.isSettings({ moduleId: "a" })).toBe(true);
    expect(portalModuleSettingsCodec.isSettings({ moduleId: "" })).toBe(false);
  });
});

describe("vuuTableSettingsCodec", () => {
  const settings = { module: "SIMUL", serverId: "uat", table: "instruments" };

  it("decodes valid settings", () => {
    expect(vuuTableSettingsCodec.decode(settings)).toEqual({
      ok: true,
      value: settings,
    });
    const tableState = { config: { columns: [{ name: "ric" }] } };
    expect(vuuTableSettingsCodec.decode({ ...settings, tableState })).toEqual({
      ok: true,
      value: { ...settings, tableState },
    });
  });

  it.each([
    [null, "$"],
    [{ ...settings, serverId: "" }, "$.serverId"],
    [{ module: "SIMUL", table: "instruments" }, "$.serverId"],
    [{ serverId: "uat", table: "instruments" }, "$.module"],
    [{ ...settings, table: 1 }, "$.table"],
    [{ ...settings, tableSchema: { columns: [] } }, "$.tableSchema"],
  ])("rejects %j at %s", (value, path) => {
    expect(vuuTableSettingsCodec.decode(value as never)).toMatchObject({
      error: { path },
      ok: false,
    });
  });

  it("rejects a tableState that is not JSON", () => {
    expect(
      vuuTableSettingsCodec.encode({
        ...settings,
        tableState: { fn: () => undefined } as never,
      }),
    ).toMatchObject({ error: { path: "$.tableState" }, ok: false });
  });
});

describe("templates", () => {
  it("builds a portal-module template from a module", () => {
    expect(portalModuleTemplate({ id: 7, title: "Baskets" })).toEqual({
      component: {
        settings: { moduleId: "7" },
        type: "portal-module",
        version: 1,
      },
      label: "Baskets",
    });
  });

  it("builds a vuu-table template without a schema", () => {
    expect(
      vuuTableTemplate({ module: "SIMUL", serverId: "uat", table: "prices" }),
    ).toEqual({
      component: {
        settings: { module: "SIMUL", serverId: "uat", table: "prices" },
        type: "vuu-table",
        version: 1,
      },
      label: "prices",
    });
  });
});

describe("createPortalComponentRegistries", () => {
  it("registers portal-module and vuu-table", () => {
    const { renderers, settingsCodecs } = createPortalComponentRegistries();
    for (const [type, settings] of [
      ["portal-module", { moduleId: "1" }],
      ["vuu-table", { module: "M", serverId: "s", table: "t" }],
    ] as const) {
      expect(
        settingsCodecs.decode({ id: "c1", settings, type, version: 1 }),
      ).toMatchObject({ ok: true, value: { settings, type } });
      expect(
        isValidElement(
          renderers.render({ id: "c1", settings, type, version: 1 }),
        ),
      ).toBe(true);
    }
    expect(
      settingsCodecs.decode({
        id: "c1",
        settings: { moduleId: 1 },
        type: "portal-module",
        version: 1,
      }),
    ).toMatchObject({ ok: false });
  });

  it("accepts additional host types and rejects duplicates", () => {
    const note: WorkspaceComponentRegistration<unknown> = {
      codec: jsonValueWorkspaceComponentCodec,
      render: () => <div />,
      type: "note",
    };
    const { settingsCodecs } = createPortalComponentRegistries({
      additional: [note],
    });
    expect(
      settingsCodecs.decode({
        id: "n",
        settings: "hi",
        type: "note",
        version: 1,
      }),
    ).toMatchObject({ ok: true });
    expect(() =>
      createPortalComponentRegistries({
        additional: [{ ...note, type: "vuu-table" }],
      }),
    ).toThrow();
  });
});
