import {
  EMPTY_MODULE_CONFIG,
  type ModuleConfig,
} from "@heswell/module-admin/contracts";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { toConfig } from "../src/data/module-model";
import { type ModuleDraft, useModuleDraft } from "../src/data/useModuleDraft";
import { MODULES } from "./fixtures";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
});

const renderDraft = (props: {
  initial: ModuleConfig;
  mode: "create" | "edit";
  moduleId?: number;
}) => {
  const current: { draft?: ModuleDraft } = {};
  const Harness = () => {
    current.draft = useModuleDraft({ ...props, modules: MODULES });
    return null;
  };
  root = createRoot(document.createElement("div"));
  act(() => root?.render(<Harness />));
  return () => current.draft as ModuleDraft;
};

describe("useModuleDraft", () => {
  it("derives name, access role and route while creating", () => {
    const draft = renderDraft({ initial: EMPTY_MODULE_CONFIG, mode: "create" });
    act(() => draft().set("title", "Risk Dashboard"));
    act(() => draft().setLocation("Risk", "Daily View"));
    expect(draft().config).toMatchObject({
      accessRole: "risk-dashboard-access",
      location: "/Risk/Daily View",
      name: "risk-dashboard",
      path: "/risk/daily-view",
    });
    expect(draft().section).toBe("Risk");
    expect(draft().label).toBe("Daily View");
  });

  it("stops deriving a field once the user has touched it", () => {
    const draft = renderDraft({ initial: EMPTY_MODULE_CONFIG, mode: "create" });
    act(() => draft().touch("name"));
    act(() => draft().set("name", "custom"));
    act(() => draft().touch("path"));
    act(() => draft().set("path", "/custom"));
    act(() => draft().set("title", "Risk Dashboard"));
    act(() => draft().setLocation("Risk", "Dashboard"));
    expect(draft().config).toMatchObject({
      accessRole: "custom-access",
      name: "custom",
      path: "/custom",
    });
  });

  it("clears location and derived role for a child module", () => {
    const draft = renderDraft({ initial: EMPTY_MODULE_CONFIG, mode: "create" });
    act(() => draft().set("title", "Child"));
    act(() => draft().setLocation("Tools", "Child"));
    act(() => draft().set("parentModuleId", 2));
    expect(draft().config).toMatchObject({ accessRole: "", location: "" });
    act(() => draft().set("parentModuleId", 0));
    expect(draft().config).toMatchObject({
      accessRole: "child-access",
      location: "/Tools/Child",
    });
  });

  it("shows errors for touched fields, or all after submit", () => {
    const draft = renderDraft({ initial: EMPTY_MODULE_CONFIG, mode: "create" });
    expect(draft().errorCount).toBeGreaterThan(0);
    expect(draft().visibleErrors).toEqual({});
    act(() => draft().touch("title"));
    expect(Object.keys(draft().visibleErrors)).toEqual(["title"]);
    act(() => draft().touch("section"));
    expect(draft().visibleErrors).toHaveProperty("location");
    act(() => draft().setSubmitted(true));
    expect(draft().visibleErrors).toEqual(draft().errors);
  });

  it("tracks changes when editing without deriving fields", () => {
    const initial = toConfig(MODULES[0]);
    const draft = renderDraft({ initial, mode: "edit", moduleId: 1 });
    expect(draft().errors).toEqual({});
    expect(draft().dirty).toBe(false);
    act(() => draft().set("title", "Basket trading desk"));
    expect(draft().config.name).toBe("basket-trading");
    expect(draft().changes).toEqual({ title: "Basket trading desk" });
    expect(draft().dirty).toBe(true);
    act(() => draft().reset());
    expect(draft().config).toEqual(initial);
    expect(draft().dirty).toBe(false);
  });

  it("validates uniqueness against other modules", () => {
    const draft = renderDraft({ initial: EMPTY_MODULE_CONFIG, mode: "create" });
    act(() => draft().set("title", "Basket trading"));
    expect(draft().errors.name).toBeTruthy();
  });
});
