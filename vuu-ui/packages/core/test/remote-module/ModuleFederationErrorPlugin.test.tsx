import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRemoteModuleErrorPlugin } from "../../src/remote-module/ModuleFederationErrorPlugin";

describe("createRemoteModuleErrorPlugin", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("provides a compatibility message when a remote module cannot load", async () => {
    const plugin = createRemoteModuleErrorPlugin();
    const fallback = plugin.errorLoadRemote?.({
      error: Error("Version 3.3.8 does not satisfy the requirement 3.3.5"),
      from: "runtime",
      id: "feature/Feature",
      lifecycle: "onLoad",
      origin: {} as never,
    }) as { default: ComponentType } | undefined;

    expect(fallback).toEqual({
      default: expect.any(Function),
    });

    const FallbackComponent = fallback?.default;
    expect(FallbackComponent).toBeDefined();

    await act(async () => {
      root.render(<FallbackComponent />);
    });

    expect(container.textContent).toContain("Unable to load feature/Feature");
    expect(container.textContent).toContain(
      "This module is incompatible with the version of VUU used by this portal.",
    );
    expect(container.textContent).toContain(
      "Version 3.3.8 does not satisfy the requirement 3.3.5",
    );
  });

  it("does not replace failures outside remote component loading", () => {
    const plugin = createRemoteModuleErrorPlugin();

    expect(
      plugin.errorLoadRemote?.({
        error: Error("Failed to resolve remote"),
        from: "runtime",
        id: "feature/Feature",
        lifecycle: "afterResolve",
        origin: {} as never,
      }),
    ).toBeUndefined();
  });
});
