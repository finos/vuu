import { act, Suspense } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@module-federation/enhanced/runtime", () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}));

import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import { RemoteModule } from "../../src/remote-module/RemoteModule";

const RemoteModuleRoute = () => {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/healthy")} type="button">
        Open healthy module
      </button>
      <Suspense fallback="Loading">
        <RemoteModule
          mfComponent="Remote"
          mfScope="remote"
          mfUrl="http://localhost:5000"
        />
      </Suspense>
    </>
  );
};

describe("RemoteModule", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.mocked(loadRemote).mockResolvedValue({
      default: ({ label }: { label?: string }) => (
        <div>{label ?? "Connectionless remote loaded"}</div>
      ),
    });
    vi.mocked(registerRemotes).mockImplementation(() => {});
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

  it("forwards typed host props to the loaded remote", async () => {
    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="UserAdmin"
            mfScope="userAdmin"
            mfUrl="http://localhost:5007"
            ComponentProps={{ label: "typed host prop" }}
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toBe("typed host prop");
  });

  it("recovers from an error while registering a remote module", async () => {
    vi.mocked(registerRemotes).mockImplementation(() => {
      throw Error("Unable to register remote module");
    });

    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="BrokenRemote"
            mfScope="broken"
            mfUrl="http://localhost:5000"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );

    vi.mocked(registerRemotes).mockImplementation(() => {});

    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            mfComponent="WorkingRemote"
            mfScope="working"
            mfUrl="http://localhost:5001"
          />
        </Suspense>,
      );
    });

    expect(container.textContent).toBe("Connectionless remote loaded");
  });

  it("retries a failed remote module after navigation", async () => {
    vi.mocked(loadRemote).mockRejectedValueOnce(
      Error("Failed to load remote module"),
    );

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/broken"]}>
          <RemoteModuleRoute />
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain(
      "An error occurred while creating the remote module.",
    );

    await act(async () => {
      container.querySelector("button")?.click();
    });

    expect(container.textContent).toContain("Connectionless remote loaded");
  });
});
