import { act, Suspense } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadRemote } from "@module-federation/enhanced/runtime";

vi.mock("@module-federation/enhanced/runtime", () => ({
  loadRemote: vi.fn().mockResolvedValue({
    default: () => <div>Connectionless remote loaded</div>,
  }),
  registerRemotes: vi.fn(),
}));

import { RemoteModule } from "../../src/remote-module/RemoteModule";

describe("RemoteModule", () => {
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

  it("loads a remote without a Vuu connection when metadata is absent", async () => {
    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="ConnectionlessRemote"
            mfScope="connectionless"
            mfUrl="http://localhost:5000"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toBe("Connectionless remote loaded");
  });

  it("renders a compatibility message when a remote load rejects", async () => {
    vi.mocked(loadRemote).mockRejectedValueOnce(
      Error("Version 3.3.8 does not satisfy the requirement 3.3.5"),
    );

    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="IncompatibleRemote"
            mfScope="incompatible"
            mfUrl="http://localhost:5001"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toContain(
      "This module is incompatible with the version of VUU used by this portal.",
    );
    expect(container.textContent).toContain(
      "Version 3.3.8 does not satisfy the requirement 3.3.5",
    );
  });
});
