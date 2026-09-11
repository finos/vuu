import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@module-federation/enhanced/runtime", () => ({
  loadRemote: vi.fn().mockResolvedValue({
    default: () => <div>Connectionless remote loaded</div>,
  }),
  registerRemotes: vi.fn(),
}));

import { registerRemotes } from "@module-federation/enhanced/runtime";
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
        <RemoteModule
          mfComponent="ConnectionlessRemote"
          mfScope="connectionless"
          mfUrl="http://localhost:5000"
        />,
      );
    });

    expect(container.textContent).toBe("Connectionless remote loaded");
  });

  it("renders a boundary message when remote registration fails", async () => {
    vi.mocked(registerRemotes).mockImplementationOnce(() => {
      throw Error("remote shared dependency is incompatible");
    });

    await act(async () => {
      root.render(
        <RemoteModule
          mfComponent="RegistrationFailure"
          mfScope="registration-failure"
          mfUrl="http://localhost:5001"
        />,
      );
    });

    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );
    expect(container.textContent).toContain(
      "remote shared dependency is incompatible",
    );
  });
});
