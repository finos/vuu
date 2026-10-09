import { describe, expect, it } from "vitest";
import { asHostMode, getDefaultHostMode } from "../src/shared-utils";
import { getExampleModuleDescriptor } from "../src/ShowcasePortalHost";

const component = (tags?: string[], attributes?: Record<string, string>) => ({
  attributes,
  componentName: "ModulePlacement",
  kind: "component" as const,
  moduleName: "examples/VuuPortal/ContextPanel",
  tags,
});

describe("showcase portal hosting", () => {
  it("hosts examples tagged remote-module in a portal by default", () => {
    expect(getDefaultHostMode(component(["remote-module"]))).toBe("portal");
    expect(getDefaultHostMode(component(["data-consumer"]))).toBe("component");
    expect(getDefaultHostMode(component())).toBe("component");
    expect(
      getDefaultHostMode({ kind: "document", moduleName: "examples/Index" }),
    ).toBe("component");
  });

  it("reads the host mode from the url", () => {
    expect(asHostMode("portal")).toBe("portal");
    expect(asHostMode("component")).toBe("component");
    expect(asHostMode("window")).toBeUndefined();
    expect(asHostMode(undefined)).toBeUndefined();
  });

  it("describes an example as a module of the showcase remote", () => {
    const path = "/VuuPortal/ContextPanel/ModulePlacement";
    expect(
      getExampleModuleDescriptor(
        component(["remote-module"], {
          contextPanelPlacement: "module",
          title: "Placement",
        }),
        path,
      ),
    ).toEqual(
      expect.objectContaining({
        contextPanelPlacement: "module",
        id: path,
        mfComponent: "examples/VuuPortal/ContextPanel",
        mfExport: "ModulePlacement",
        mfScope: "showcase_examples",
        mfUrl: "/showcase-examples",
        path,
        title: "Placement",
      }),
    );
    expect(
      getExampleModuleDescriptor(
        component(["remote-module"], { contextPanelPlacement: "elsewhere" }),
        path,
      ).contextPanelPlacement,
    ).toBeUndefined();
  });
});
