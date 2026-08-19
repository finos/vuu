import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteModuleErrorBoundary } from "../../src/remote-module/RemoteModuleErrorBoundary";

const BrokenRemote = (): ReactNode => {
  throw Error("remote failed");
};

describe("RemoteModuleErrorBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("reports remote failures to the owner", async () => {
    const onError = vi.fn();

    await act(async () => {
      root.render(
        <RemoteModuleErrorBoundary
          mfComponent="TestComponent"
          mfScope="test"
          mfUrl="http://localhost:5000"
          onError={onError}
        >
          <BrokenRemote />
        </RemoteModuleErrorBoundary>,
      );
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "remote failed" }),
    );
    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );
  });
});
